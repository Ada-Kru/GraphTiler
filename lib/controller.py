from .db_interface import DBInterface
# import cfg


class GraphTilerController:
    """Main controller for Graph Tiler."""

    def __init__(self, app, loop):
        self._app = app
        self._loop = loop
        self._db = DBInterface()

    def add_now(self, data):
        """Add data for the current point in time."""
        print(data)
        return {}

    def add(self, data):
        """Add data for a time point(s)."""
        print(data)
        return {}
