from quart import (
    jsonify,
    make_response,
    Quart,
    render_template,
    request,
    url_for,
    abort,
)
from asyncio import get_event_loop
from lib.controller import GraphTilerController
from lib.validation import is_valid_year_month_day
import cfg


app = Quart(__name__)
# app.json_encoder = GTJSONEncoder
app.broadcast_clients = set()
loop = get_event_loop()
ctrl = GraphTilerController(app=app, loop=loop)


@app.route("/<filename>")
async def index(filename):
    if filename not in (None, "index.html"):
        abort(404)
        return "404: Not Found"
    response = await make_response(
        await render_template("index.html" if filename is None else filename)
    )
    response.push_promises.add(url_for("static", filename="images/idle.ico"))
    response.push_promises.add(url_for("static", filename="graphtiler.css"))
    response.push_promises.add(url_for("static", filename="main.js"))
    return response


@app.route("/graph/<year>/<month>/<day>")
async def day_graph(year, month, day):
    if not is_valid_year_month_day(year, month, day):
        abort(404)
        return ""
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


@app.route("/category/<name>/<action>", methods=["GET", "POST"])
async def timepoints(name, action):
    result = {}
    if request.method == "POST":
        if action == "now":
            result = ctrl.add_now(name, await request.get_json())
        elif action == "add":
            result = ctrl.add(name, await request.get_json())
        elif action == "remove":
            result = ctrl.remove_points(name, await request.get_json())
        elif action == "remove_all":
            result = ctrl.remove_all_points(name)
    else:
        if action == "get_points":
            result = ctrl.get_points(name, await request.get_json())
    return jsonify(result)


@app.route("/remove_category/<name>", methods=["POST"])
async def remove_category(name):
    return jsonify(ctrl.remove_category(name))


@app.route("/modify_category/<name>", methods=["POST"])
async def modify_category(name):
    return jsonify(ctrl.modify_category(name, await request.get_json()))


@app.cli.command("run")
def run():
    app.run(port=cfg.SERVER_PORT)
