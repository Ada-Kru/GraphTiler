from quart import (
    jsonify,
    make_response,
    Quart,
    render_template,
    request,
    url_for,
    abort,
    websocket,
)
from asyncio import get_event_loop, create_task, gather, Queue, CancelledError
from json import loads
from lib.controller import GraphTilerController
from lib.ws_connection_handler import WsConnectionHandler
import cfg

# from lib.validation_funcs import str_to_datetime


app = Quart(__name__)
# app.json_encoder = GTJSONEncoder
app.ws_handler = WsConnectionHandler()
app.data_updates = None
loop = get_event_loop()
ctrl = GraphTilerController(app=app, loop=loop)


@app.route("/<filename>")
async def index(filename):
    if filename not in (None, "index.html"):
        abort(404)
        return
    file = "index.html" if filename is None else filename
    response = await make_response(await render_template(file))
    response.push_promises.add(url_for("static", filename="images/idle.ico"))
    response.push_promises.add(url_for("static", filename="graphtiler.css"))
    response.push_promises.add(url_for("static", filename="main.js"))
    return response


@app.route("/category/<name>", methods=["GET", "POST"])
async def category(name):
    if request.method == "GET":
        return jsonify(ctrl.get_category(name))
    else:
        return jsonify(ctrl.add_category(name, await request.get_json()))


@app.route("/category/<name>/<action>", methods=["POST"])
async def timepoints(name, action):
    result = {}
    if action == "get-points":
        result = ctrl.get_points(name, await request.get_json())
    elif action == "now":
        result = ctrl.add_now(name, await request.get_json())
    elif action == "add":
        result = ctrl.add(name, await request.get_json())
    elif action == "remove":
        result = ctrl.remove_points(name, await request.get_json())
    elif action == "remove-all":
        result = ctrl.remove_all_points(name)

    if result["added_points"] and app.data_updates:
        await app.data_updates.put([name, result["added_points"]])
    return jsonify(result)


@app.route("/remove-category/<name>", methods=["POST"])
async def remove_category(name):
    return jsonify(ctrl.remove_category(name))


@app.route("/modify-category/<name>", methods=["POST"])
async def modify_category(name):
    return jsonify(ctrl.modify_category(name, await request.get_json()))


async def ws_receive(ws):
    handler = app.ws_handler
    command_map = {
        "add_connection": handler.add_connection,
        "remove_connection": handler.remove_connection,
        "add_categories": handler.add_categories,
        "remove_categories": handler.remove_categories,
    }

    try:
        while True:
            msg = await websocket.receive()
            if not msg:
                continue

            msg = loads(msg)
            # validate here
            for key, data in msg.items():
                command_map[key](ws, data)

    except CancelledError:
        return


@app.websocket("/ws")
async def ws():
    if app.data_updates is None:
        app.data_updates = Queue()

    ws = websocket._get_current_object()
    app.ws_handler.add_connection(ws)
    # producer = create_task(ws_send())
    consumer = create_task(ws_receive(ws))
    await gather(consumer)
    app.ws_handler.add_connection(ws)


@app.cli.command("run")
def run():
    app.run(port=cfg.SERVER_PORT)
