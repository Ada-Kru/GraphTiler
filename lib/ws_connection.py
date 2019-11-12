from lib.validation_funcs import str_to_datetime
from cfg import TIME_FORMAT_NO_TZ
from datetime import timezone
from json import dumps


class ws_connection:
    """Helper for websocket connections."""

    def __init__(self, websocket):
        self.start_str = websocket.args.get("start")
        self.end_str = websocket.args.get("end")
        start = str_to_datetime(self.start_str)
        end = str_to_datetime(self.end_str)
        categories = websocket.args.get("categories")
        if categories is None:
            raise AssertionError("At least one category is required.")
        if not (start and end):
            raise AssertionError("Start and end times are required.")
        if start > end:
            raise AssertionError("Start time must be <= end time.")

        self.start, self.end = start, end
        self.categories = set(categories.split(","))
        self._ws = websocket

    async def send_updates_in_range(self, category, updates):
        """Send updates in the list that are within the time range."""
        valid_updates = {}
        for update in updates:
            tm = update["time"]
            if not (tm >= self.start and tm <= self.end):
                continue
            time = tm.astimezone(timezone.utc).strftime(TIME_FORMAT_NO_TZ)
            valid_updates[time] = update["reading"]

        if valid_updates:
            await self.send_points(category, valid_updates)

    async def send_points(self, category, updates):
        """Send validated point updates."""
        if updates:
            await self._ws.send(dumps({"point_update": {category: updates}}))
