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
# app.json_encoder = HSEncoder
app.broadcast_clients = set()
loop = get_event_loop()
ctrl = GraphTilerController(app=app, loop=loop)


@app.route("/<filename>")
async def index(filename):
    if filename not in (None, "index.html"):
        abort(404)
        return ""
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


@app.route("/timepoints/<action>", methods=["GET", "POST"])
async def timepoints(action):
    if action == "now" and request.method == "POST":
        result = ctrl.add_now(await request.get_json())
        return jsonify(result)
    elif action == "add" and request.method == "POST":
        result = ctrl.add(await request.get_json())
        return jsonify(result)


@app.route("/category/", methods=["GET", "POST"])
async def category(action):
    if request.method == "GET":
        return jsonify(ctrl.get_categories())
    else:
        result = ctrl.add_category(await request.get_json())
        return jsonify(result)


@app.route("/category/remove", methods=["POST"])
async def remove_category():
    result = ctrl.remove_category(await request.get_json())
    return jsonify(result)


@app.cli.command("run")
def run():
    app.run(port=cfg.SERVER_PORT)
