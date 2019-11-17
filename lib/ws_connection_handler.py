from lib.validation_funcs import str_to_datetime
from cfg import TIME_FORMAT_NO_TZ
from datetime import timezone
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

    def add_categories(self, websocket, cat_data):
        """Add categories to a websocket connection."""
        self.remove_categories(websocket, cat_data.keys())
        for category, monitor_ranges in cat_data.items():
            for key in ("start", "end", "from"):
                if key in monitor_ranges:
                    monitor_ranges[key] = str_to_datetime(monitor_ranges[key])
            self._categories[category][websocket] = monitor_ranges

    def remove_categories(self, websocket, categories):
        """Add categories to a websocket connection."""
        for category in categories:
            self._categories[category].pop(websocket, None)

    async def send_updates(self, category, updates, skip_vali=False):
        """Send updates in the list that are within the time range."""
        if category not in self._categories:
            return

        for ws, ranges in self._categories[category].items():
            in_range = {}
            for update in updates:
                tm = update["time"]
                if not skip_vali:
                    if "start" in ranges:
                        if not (tm >= ranges["start"] and tm <= ranges["end"]):
                            continue
                    elif "from" in ranges:
                        if not (tm >= ranges["from"]):
                            continue
                time = tm.astimezone(timezone.utc).strftime(TIME_FORMAT_NO_TZ)
                in_range[time] = update["reading"]

            if in_range:
                await ws.send(dumps({"point_update": {category: in_range}}))
