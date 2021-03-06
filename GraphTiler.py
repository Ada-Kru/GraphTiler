from quart import (
    jsonify,
    make_response,
    Quart,
    render_template,
    request,
    url_for,
    abort,
    websocket,
    make_push_promise,
)
from asyncio import get_event_loop, create_task, gather, Queue, CancelledError
from json import loads, dumps, JSONDecodeError
from cerberus import Validator
from lib.controller import GraphTilerController
from lib.ws_connection_handler import WsConnectionHandler
from lib.validation import WS_MSG_SCHEMA
import cfg

RESOURCE_PATHS = [
    "images/graphTiler.ico",
    "graphTiler.css",
    "flexLayout-dark.css",
    "main.js",
]

app = Quart(__name__)
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
    for path in RESOURCE_PATHS:
        await make_push_promise(url_for("static", filename=path))

    return await make_response(await render_template(file))


@app.route("/category/", methods=["GET"])
async def get_all_categories():
    return jsonify(ctrl.get_all_categories())


@app.route("/category/<name>", methods=["GET", "POST"])
async def category(name):
    if request.method == "GET":
        return jsonify(ctrl.get_category(name))
    else:
        data = await request.get_json()
        result = ctrl.add_category(name, data)
        if result["errors"] is None:
            await app.ws_handler.send_category_added([data])
        return jsonify(result)


@app.route("/category/<name>/<action>", methods=["POST"])
async def timepoints(name, action):
    result, data = {}, None
    if action == "get-points":
        result = ctrl.get_points(name, await request.get_json())
    elif action == "now":
        result = ctrl.add_now(name, await request.get_json())
    elif action == "add":
        result = ctrl.add(name, await request.get_json())
    elif action == "remove":
        data = await request.get_json()
        result = ctrl.remove_points(name, data)
    elif action == "remove-all":
        result = ctrl.remove_all_points(name)

    if "added_points" in result:
        if app.data_updates:
            await app.ws_handler.send_updates(name, result["added_points"])
        result["added_points"] = len(result["added_points"])
    elif "removed_count" in result and result["removed_count"]:
        await app.ws_handler.removed_points(name, data)
    return jsonify(result)


@app.route("/remove-category/<name>", methods=["POST"])
async def remove_category(name):
    result = ctrl.remove_category(name)
    if result["errors"] is None:
        await app.ws_handler.send_category_removed(name)
    return jsonify(result)


@app.route("/modify-category/<name>", methods=["POST"])
async def modify_category(name):
    return jsonify(ctrl.modify_category(name, await request.get_json()))


@app.route("/layout/<action>", methods=["GET", "POST"])
async def layout_req(action):
    layout = await request.get_json()
    if action == "get":
        return jsonify(ctrl.get_layout(layout))
    elif action == "add":
        return jsonify(ctrl.add_layout(layout))
    elif action == "delete":
        return jsonify(ctrl.delete_layout(layout))


@app.route("/layouts/", methods=["GET"])
async def get_all_layouts():
    return jsonify(ctrl.get_all_layouts())


async def add_cat_ranges(ws, data):
    app.ws_handler.add_cat_ranges(ws, data)
    cat_points_in_range = ctrl.get_points_range_cats(data)
    await ws.send(dumps({"point_update": cat_points_in_range}))


async def remove_cat_ranges(ws, data):
    app.ws_handler.remove_cat_ranges(ws, data)


async def ws_receive(ws):
    ws_handler = app.ws_handler
    msg_vali = Validator(WS_MSG_SCHEMA)
    command_map = {
        "add_categories": add_cat_ranges,
        "remove_categories": remove_cat_ranges,
    }

    try:
        while True:
            msg = await ws.receive()
            if not msg:
                continue

            try:
                msg = loads(msg)
            except JSONDecodeError:
                err = {"errors": {"reason": "Invalid JSON", "sent": msg}}
                await ws.send(dumps(err))
                continue

            if not msg_vali.validate(msg):
                err = {"errors": {"reason": msg_vali.errors, "sent": msg}}
                await ws.send(dumps(err))
                continue

            for key, data in msg.items():
                await command_map[key](ws, data)

    except CancelledError:
        ws_handler.remove_connection(ws)
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


@app.cli.command("run")
def run():
    app.run(port=cfg.SERVER_PORT)
