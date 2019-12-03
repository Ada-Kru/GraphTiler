from lib.validation_funcs import str_to_datetime
from cfg import TIME_FORMAT_NO_TZ
from datetime import timezone, timedelta, datetime
from collections import defaultdict
from json import dumps


class WsConnectionHandler:
    """Helper for websocket connections."""

    def __init__(self):
        self._categories = defaultdict(dict)
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
        for category, monitor_ranges in cat_data.items():
            if category not in self._categories:
                self._categories[category] = {}
            if websocket not in self._categories[category]:
                self._categories[category][websocket] = {}
            for range_id, ranges in monitor_ranges.items():
                for key in ("start", "end", "since", "past"):
                    if key in ranges:
                        ranges[key] = str_to_datetime(ranges[key])
                self._categories[category][websocket][range_id] = ranges

    def remove_cat_ranges(self, websocket, categories):
        """Add categories to a websocket connection."""
        for cat_name, ranges in categories.items():
            if cat_name not in self._categories:
                continue

            stored_cat = self._categories[cat_name]
            if websocket in stored_cat:
                for key in ranges:
                    stored_cat[websocket].pop(key, None)
                if not stored_cat[websocket]:
                    del stored_cat[websocket]

            if not stored_cat:
                del self._categories[cat_name]

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
