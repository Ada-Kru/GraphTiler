from quart import (
    jsonify,
    make_response,
    Quart,
    render_template,
    request,
    url_for,
    abort,
)
from asyncio import get_event_loop, create_task, gather, Queue, CancelledError
from collections import defaultdict
from functools import wraps
from lib.controller import GraphTilerController
from lib.validation_funcs import str_to_datetime
from lib.ws_helper import ws_helper
import cfg


app = Quart(__name__)
# app.json_encoder = GTJSONEncoder
app.ws_clients = defaultdict(set)
app.data_updates = Queue()
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


# http://192.168.2.111:7123/graph?start=2019-11-06%2000%3A00%20-0600&end=2019-11-06%2023%3A59%20-0600&categories=PCBandwidth
@app.route("/graph", methods=["GET"])
async def day_graph():
    start = str_to_datetime(request.args.get("start"))
    end = str_to_datetime(request.args.get("end"))
    if not (start and end):
        reason = (
            "Invalid date time format.  Date time format must be "
            "'YYYY-MM-DD HH:MM &#177HHMM' where '&#177HHMM' is the time zone "
            "offset (ex. '2020-01-20 18:45 -0600'). All numbers must have "
            "leading zeros and hours are in 24 hour format."
        )
        abort(400, reason)
        return
    if start > end:
        abort(400, "Start time is after end time.")
        return
    # categories = request.args.get("categories").split(',')
    response = await make_response(await render_template("dayGraph.html"))
    response.push_promises.add(url_for("static", filename="images/idle.ico"))
    response.push_promises.add(url_for("static", filename="graphtiler.css"))
    response.push_promises.add(url_for("static", filename="singleGraph.js"))
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

    if result["ws_updates"]:
        await app.data_updates.put([name, result["ws_updates"]])
    return jsonify(result)


@app.route("/remove-category/<name>", methods=["POST"])
async def remove_category(name):
    return jsonify(ctrl.remove_category(name))


@app.route("/modify-category/<name>", methods=["POST"])
async def modify_category(name):
    return jsonify(ctrl.modify_category(name, await request.get_json()))


async def ws_send():
    while True:
        try:
            category, updates = await app.data_updates.get()
            for helper in app.ws_clients[category]:
                await helper.send_updates_in_range(updates)
        except CancelledError:
            pass


async def ws_receive():
    while True:
        data = await websocket.receive()


def assign_websocket(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        helper = ws_helper(request, websocket._get_current_object())
        for category in helper.categories:
            app.ws_clients[category].add(helper)
        try:
            return await func(*args, **kwargs)
        finally:
            for category in helper.categories:
                app.ws_clients[category].remove(helper)
                if not app.ws_clients[category]:
                    app.ws_clients.pop(category, None)

    return wrapper


@app.websocket("/ws")
@assign_websocket
async def ws():
    try:
        producer = create_task(ws_send())
        consumer = create_task(ws_receive())
        await gather(producer, consumer)
    except AssertionError:
        return


@app.cli.command("run")
def run():
    app.run(port=cfg.SERVER_PORT)
