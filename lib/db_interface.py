from pymongo import MongoClient, UpdateOne
from lib.funcs import no_errors
from lib.validation import ADD_READING_SCHEMA, ADD_SCHEMA, make_min_max_vali
from cerberus import Validator
from datetime import datetime
from cfg import MONGO_PORT, MONGO_ADDRESS, TIME_FORMAT


class DBInterface:
    """Interface for MongoDB."""

    def __init__(self):
        self._client = MongoClient(f"mongodb://{MONGO_ADDRESS}:{MONGO_PORT}")
        self._db = self._client.graphTiler
        self._add_vali = Validator(ADD_SCHEMA, require_all=True)
        self._point_vali = Validator(ADD_READING_SCHEMA, require_all=True)

    def add_points(self, catname, data):
        """Add data points to the database."""
        errors = []
        updates = []
        cat_info = self.get_category(catname)

        if not cat_info:
            errors.append(
                {"index": -1, "error": f'Category "{catname}" not found.'}
            )
            return {"errors": errors}
        min_max_vali = make_min_max_vali(cat_info)

        if not self._add_vali.validate(data):
            errors.append({"index": -1, "error": self._add_vali.errors})
            return {"errors": errors}

        for i, point in enumerate(data["readings"]):
            if not self._point_vali.validate(point):
                errors.append({"index": i, "error": self._point_vali.errors})
            elif not min_max_vali.validate(point):
                errors.append({"index": i, "error": min_max_vali.errors})
            else:
                point["time"] = datetime.strptime(point["time"], TIME_FORMAT)
                update = UpdateOne(
                    {"time": point["time"]}, {"$set": point}, upsert=True
                )
                updates.append(update)

        if updates:
            self._db[f"catdata_default_{catname}"].bulk_write(updates)

        return no_errors() if not errors else {"errors": errors}

    def get_category(self, catname):
        """Get information on the current categories."""
        return self._db.categories.find_one({"name": catname})

    def add_category(self, catname, data):
        """Add categories to the database."""
        if self.get_category(catname):
            return {
                "errors": {
                    "name": f'A category named "{catname}" already exists.'
                }
            }
        data["name"] = catname
        self._db.categories.insert_one(data)
        return no_errors()

    def modify_category(self, catname, data):
        """
        Modify an existing category.

        Does not make any changes to the data points for the category.
        """
        if not self.get_category(catname):
            return {
                "errors": {"name": f'Category "{catname}" does not exist.'}
            }
        self._db.categories.delete_one({"name": catname})
        data["name"] = catname
        self._db.categories.insert_one(data)
        return no_errors()

    def remove_category(self, catname):
        """Remove a category."""
        if self.get_category(catname) is None:
            return {"errors": f'Category "{catname}" does not exist.'}
        self._db.categories.delete_one({"name": catname})
        self._db[f"catdata_default_{catname}"].drop()
        return no_errors()

    def get_points(self, catname, data):
        """Get data points for a specific time or time range."""
        if self.get_category(catname) is None:
            return {"errors": f'Category "{catname}" does not exist.'}

        points = {}
        cat_data = self._db[f"catdata_default_{catname}"]

        if "times" in data:
            data["times"] = [
                datetime.strptime(time_str, TIME_FORMAT)
                for time_str in data["times"]
            ]
            times = data["times"]
            for item in cat_data.find({"time": {"$in": times}}):
                points[item["time"].strftime(TIME_FORMAT)] = item["reading"]
        if "range" in data:
            start = datetime.strptime(data["range"]["start"], TIME_FORMAT)
            end = datetime.strptime(data["range"]["end"], TIME_FORMAT)
            for item in cat_data.find({"time": {"$gte": start, "$lt": end}}):
                points[item["time"].strftime(TIME_FORMAT)] = item["reading"]

    def remove_points(self, catname, data):
        """Remove datapoints from the database."""
        if self.get_category(catname) is None:
            return {"errors": f'Category "{catname}" does not exist.'}

        output = {"removed_count": 0}
        cat_data = self._db[f"catdata_default_{catname}"]

        if "times" in data:
            data["times"] = [
                datetime.strptime(time_str, TIME_FORMAT)
                for time_str in data["times"]
            ]
            times = data["times"]
            res = cat_data.delete_many({"time": {"$in": times}})
            output["removed_count"] += res.deleted_count
        if "range" in data:
            start = datetime.strptime(data["range"]["start"], TIME_FORMAT)
            end = datetime.strptime(data["range"]["end"], TIME_FORMAT)
            res = cat_data.delete_many({"time": {"$gte": start, "$lt": end}})
            output["removed_count"] += res.deleted_count

        output["errors"] = None
        return output

    def remove_all_points(self, catname):
        """Remove datapoints from the database."""
        cat_data = f"catdata_default_{catname}"
        res = self._db[cat_data].delete_many({})

        return {"errors": None, "removed_count": res.deleted_count}
