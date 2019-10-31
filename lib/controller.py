from .db_interface import DBInterface
from lib.validation import db_name_validator, new_category_validator
from datetime import datetime
import cfg


class GraphTilerController:
    """Main controller for Graph Tiler."""

    def __init__(self, app, loop):
        self._app = app
        self._loop = loop
        self._db = DBInterface()
        self._new_cat_validator = new_category_validator
        self._db_name_validator = db_name_validator

    def add_now(self, catname, data):
        """Add data for the current point in time."""
        time_str = datetime.now().strftime(cfg.TIME_FORMAT)
        data["time"] = time_str
        print({"readings": [data]})
        ret_data = self.add(catname, {"readings": [data]})
        if ret_data["errors"] is None:
            ret_data["added_at"] = time_str
        return ret_data

    def add(self, catname, data):
        """Add data for a time point(s)."""
        return self._db.add_points(catname, data)

    def add_category(self, catname, data):
        """Add a new category."""
        if not self._db_name_validator({"name": catname}):
            return {"errors": f"\"{catname}\" is an invalid category name."}
        if not self._new_cat_validator.validate(data):
            return {"errors": self._new_cat_validator.errors}

        return self._db.add_category(catname, data)

    def modify_category(self, catname, data):
        """Add a new category."""
        if not self._new_cat_validator.validate(data):
            return {"errors": self._new_cat_validator.errors}

        return self._db.modify_category(catname, data)

    def get_category(self, catname):
        """Get information about a category."""
        category = self._db.get_category(catname)
        category.pop("_id", None)
        return category

    def remove_category(self, catname):
        """Remove a category."""
        return self._db.remove_category(catname)
