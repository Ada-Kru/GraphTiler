from .db_interface import DBInterface
# from lib.funcs import no_errors
from lib.validation import (
    CAT_NAME_SCHEMA,
    NEW_CAT_SCHEMA,
    POINT_DATA_SCHEMA,
    GET_REMOVE_POINTS_SCHEMA,
)
from datetime import datetime
from cerberus import Validator
from cfg import TIME_FORMAT, TIME_FORMAT_NO_TZ


class GraphTilerController:
    """Main controller for Graph Tiler."""

    def __init__(self, app, loop):
        self._app = app
        self._loop = loop
        self._db = DBInterface()
        self._cat_vali = Validator(NEW_CAT_SCHEMA, require_all=True)
        self._cat_name_vali = Validator(CAT_NAME_SCHEMA, require_all=True)
        self._points_vali = Validator(POINT_DATA_SCHEMA, require_all=True)
        self._get_rem_vali = Validator(GET_REMOVE_POINTS_SCHEMA)

    def add_now(self, catname, data):
        """Add data for the current point in time."""
        time_str = datetime.utcnow().strftime(TIME_FORMAT_NO_TZ) + " +0000"
        data["time"] = time_str
        ret_data = self._db.add_points(catname, {"readings": [data]})
        if ret_data["errors"] is None:
            ret_data["added_at"] = time_str
        return ret_data

    def add(self, catname, data):
        """Add data for a time point(s)."""
        return self._db.add_points(catname, data)

    def add_category(self, catname, data):
        """Add a new category."""
        if not self._cat_name_vali({"name": catname}):
            return {"errors": f'"{catname}" is an invalid category name.'}
        if not self._cat_vali.validate(data):
            return {"errors": self._cat_vali.errors}

        return self._db.add_category(catname, data)

    def modify_category(self, catname, data):
        """Add a new category."""
        if not self._cat_vali.validate(data):
            return {"errors": self._cat_vali.errors}

        return self._db.modify_category(catname, data)

    def get_category(self, catname):
        """Get information about a category."""
        category = self._db.get_category(catname)
        if category is not None:
            category.pop("_id", None)
        return category

    def remove_category(self, catname):
        """Remove a category."""
        return self._db.remove_category(catname)

    def _validate_get_remove_points(self, data):
        if not self._get_rem_vali.validate(data):
            return self._get_rem_vali.errors
        if "times" not in data and "range" not in data:
            return "No times or ranges present in request."
        if "range" in data:
            start = datetime.strptime(data["range"]["start"], TIME_FORMAT)
            end = datetime.strptime(data["range"]["end"], TIME_FORMAT)
            if end < start:
                return "Start range later than end range."
        return None

    def get_points(self, catname, data):
        """Get data for the specified times."""
        errors = self._validate_get_remove_points(data)
        if errors is not None:
            return {"errors": errors}

        return self._db.get_points(catname, data)

    def remove_points(self, catname, data):
        """Remove timepoints from a category."""
        errors = self._validate_get_remove_points(data)
        if errors is not None:
            return {"errors": errors}

        return self._db.remove_points(catname, data)

    def remove_all_points(self, catname):
        """Remove timepoints from a category."""
        return self._db.remove_all_points(catname)
