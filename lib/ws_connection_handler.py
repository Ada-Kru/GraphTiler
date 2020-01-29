from lib.validation_funcs import str_to_datetime
from cfg import TIME_FORMAT_NO_TZ, TIME_MULTS
from datetime import timezone, timedelta, datetime
from json import dumps


class WsConnectionHandler:
    """
    Holds information about monitored categories and time ranges.

    Holds information about monitored categories and time ranges for connected
    websocket instances for the duration of their connection.
    """

    def __init__(self):
        # The websocket instances themselves are used as keys for each
        # currently monitored category.
        #
        # Format: self._categories[category][websocket_obj][unique_id]
        # where the value pointed to by unique_id is range data for the current
        # connection and category.
        self._categories = {}
        self._connections = set()

    def add_connection(self, websocket):
        """Add a new websocket connection."""
        self._connections.add(websocket)

    def remove_connection(self, websocket):
        """Add a new websocket connection."""
        self._connections.discard(websocket)
        empty_cats = []
        for category in self._categories.keys():
            self._categories[category].pop(websocket, None)
            if not self._categories[category]:
                empty_cats.append(category)

        for category in empty_cats:
            self._categories.pop(category, None)

    def _is_equal_range(self, a, b):
        """Check if ranges are equal."""
        type = a["range_type"]
        if type != b["range_type"]:
            return False
        if type == "past":
            return (
                a["past_unit"] == b["past_unit"]
                and a["past_amount"] == b["past_amount"]
            )
        if type == "since":
            return a["since"] == b["since"]
        else:
            return a["start"] == b["start"] and a["end"] == b["end"]

    def _add_category_dict(self, category, websocket, cat_data):
        unique_id, range_data = cat_data["unique_id"], cat_data["range"]
        if category not in self._categories:
            self._categories[category] = {websocket: {unique_id: range_data}}
        elif websocket not in self._categories[category]:
            self._categories[category][websocket] = {unique_id: range_data}
        else:
            self._categories[category][websocket][unique_id] = range_data

    def add_cat_ranges(self, websocket, data):
        """Add categories to a websocket connection."""
        for cat_data in data:
            if "range" not in cat_data:
                continue
            range_data = cat_data["range"]
            for key in ("start", "end", "since"):
                if key in range_data:
                    range_data[key] = str_to_datetime(range_data[key])
            for category in cat_data["categories"]:
                self._add_category_dict(category, websocket, cat_data)

    def remove_cat_ranges(self, websocket, data):
        """Remove categories from a websocket connection."""
        different = []
        for cat_data in data:
            for category in cat_data["categories"]:
                diff = []
                different.append(diff)
                if category not in self._categories:
                    diff.append(category)
                    continue

                stored_cat = self._categories[category]
                if websocket in stored_cat:
                    sc = stored_cat[websocket]
                    stored_range = sc.pop(cat_data["unique_id"], None)
                    if "range" in cat_data:
                        cr = cat_data["range"]
                        if not self._is_equal_range(cr, stored_range):
                            diff.append(category)
                    if not stored_cat[websocket]:
                        del stored_cat[websocket]

                if not stored_cat:
                    del self._categories[category]
        return different

    async def send_updates(self, category, updates, skip_vali=False):
        """Send updates for the category that are within the time range."""
        if category not in self._categories:
            return

        for ws, ranges in self._categories[category].items():
            in_range, now = {}, datetime.now(timezone.utc)
            for update in updates:
                tm = update["time"]
                if not skip_vali:
                    for rng in ranges.values():
                        rtype = rng["range_type"]
                        if rtype == "past":
                            amnt, unit = rng["past_amount"], rng["past_unit"]
                            delta = timedelta(seconds=amnt * TIME_MULTS[unit])
                            if not (tm >= (now - delta)):
                                continue
                        elif rtype == "since" and not (tm >= rng["since"]):
                            continue
                        elif rtype == "timerange" and not (
                            tm >= rng["start"] and tm <= rng["end"]
                        ):
                            continue
                time = tm.astimezone(timezone.utc).strftime(TIME_FORMAT_NO_TZ)
                in_range[time] = update["reading"]

            if in_range:
                await ws.send(dumps({"point_update": {category: in_range}}))

    async def removed_points(self, catname, range):
        """Notify all relevant connections that points have been removed."""
        if catname not in self._categories:
            return

        for ws in list(self._categories[catname].keys()):
            await ws.send(dumps({"removed_points": {catname: range}}))

    async def send_category_added(self, cat_data):
        """Notify all connections that a category was added."""
        for ws in self._connections:
            await ws.send(dumps({"category_added": cat_data}))

    async def send_category_removed(self, category):
        """Notify all connections that a category was removed."""
        for ws in self._connections:
            await ws.send(dumps({"category_removed": [category]}))
