from lib.validation_funcs import str_to_datetime
from cfg import TIME_FORMAT_NO_TZ


class ws_helper:
    """Helper for websocket connections."""

    def __init__(self, request, websocket):
        self.start_str = request.args.get("start")
        self.end_str = request.args.get("end")
        start = str_to_datetime(self.start_str)
        end = str_to_datetime(self.end_str)
        categories = request.args.get("categories")
        if categories is None:
            raise AssertionError("At least one category is required.")
        if not (start and end):
            raise AssertionError("Start and end times are required.")
        if start > end:
            raise AssertionError("Start time must be <= end time.")

        self.start, self.end = start, end
        self.categories = set(categories.split(","))
        self._websocket = websocket

    async def send_updates(self, category, updates, validate_times=True):
        """Send updates in the list that are within the time range."""
        valid_updates = {}
        for update in updates:
            if validate_times:
                tm = update["time"]
                if not (tm >= self.start and tm <= self.end):
                    continue
            time = update["time"].strftime(TIME_FORMAT_NO_TZ)
            valid_updates[time] = update["reading"]

        if valid_updates:
            await self._websocket.send({category: valid_updates})
