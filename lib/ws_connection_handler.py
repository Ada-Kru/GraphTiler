from lib.validation_funcs import str_to_datetime
from cfg import TIME_FORMAT_NO_TZ
from datetime import timezone, timedelta, datetime
from collections import defaultdict
from json import dumps


class WsConnectionHandler:
    """Helper for websocket connections."""

    def __init__(self):
        self._categories = defaultdict(lambda: defaultdict(dict))
        self._connections = set()

    def add_connection(self, websocket):
        """Add a new websocket connection."""
        self._connections.add(websocket)

    def remove_connection(self, websocket):
        """Add a new websocket connection."""
        self._connections.discard(websocket)
        for category in self._categories.keys():
            self._categories[category].discard(websocket)

    def remove_entire_category(self, category):
        """Remove an entire category for all connections."""
        self._connections.pop(category, None)

    def add_cat_ranges(self, websocket, cat_data):
        """Add categories to a websocket connection."""
        self.remove_cat_ranges(websocket, cat_data)

        unique_id = cat_data["unique_id"]
        range_data = cat_data["range"]
        for key in ("start", "end", "since"):
            if key in range_data:
                range_data[key] = str_to_datetime(range_data[key])

        for category in cat_data["categories"]:
            self._categories[category][websocket][unique_id] = range_data

    def remove_cat_ranges(self, websocket, cat_data):
        """Add categories to a websocket connection."""
        for category in cat_data["categories"]:
            if category not in self._categories:
                continue

            stored_cat = self._categories[category]
            if websocket in stored_cat:
                stored_cat[websocket].pop(cat_data["unique_id"], None)
                if not stored_cat[websocket]:
                    del stored_cat[websocket]

            if not stored_cat:
                del self._categories[category]

    async def send_updates(self, category, updates, skip_vali=False):
        """Send updates in the list that are within the time range."""
        if category not in self._categories:
            return

        for ws, ranges in self._categories[category].items():
            in_range = {}
            now = datetime.now()
            for update in updates:
                tm = update["time"]
                if not skip_vali:
                    for rng in ranges.values():
                        if "start" in rng:
                            if not (tm >= rng["start"] and tm <= rng["end"]):
                                continue
                        elif "since" in rng:
                            if not (tm >= rng["since"]):
                                continue
                        elif "past" in rng:
                            delta = timedelta(seconds=rng["past"])
                            if not (tm >= (now - delta)):
                                continue
                time = tm.astimezone(timezone.utc).strftime(TIME_FORMAT_NO_TZ)
                in_range[time] = update["reading"]

            if in_range:
                await ws.send(dumps({"point_update": {category: in_range}}))
