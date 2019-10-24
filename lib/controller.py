from .db_interface import DBInterface
# import cfg


class GraphTilerController:
    """Main controller for Graph Tiler."""

    def __init__(self, app, loop):
        self._app = app
        self._loop = loop
        self._db = DBInterface()
        self._categories = self._db.get_categories()
        self._users = self._db.get_users()

    def add_now(self, data):
        """Add data for the current point in time."""
        print(data)
        return {}

    def add(self, data):
        """Add data for a time point(s)."""
        print(data)
        return {}
