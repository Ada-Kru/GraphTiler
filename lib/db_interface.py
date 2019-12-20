from pymongo import MongoClient, UpdateOne, DESCENDING
from pymongo.errors import CollectionInvalid
from lib.funcs import no_errors
from lib.validation import ADD_READING_SCHEMA, ADD_SCHEMA, make_min_max_vali
from lib.validation_funcs import str_to_datetime
from cerberus import Validator
from datetime import timezone, timedelta, datetime
from collections import defaultdict
from cfg import (
    MONGO_PORT,
    MONGO_ADDRESS,
    TIME_FORMAT,
    TIME_FORMAT_NO_TZ,
    TIME_MULTS,
)

KEY_ERR_MSG = "'time' and 'reading' are required keys for data points."
DATE_ERR_MSG = "Invalid date.  Date format must be "
"'YYYY-MM-DD HH:MM ±HHMM' where '±HHMM' is the time zone offset (ex. "
"'2020-01-20 18:45 -0600'). All numbers must have leading zeros and "
"hours are in 24 hour format."
READING_ERR_MSG = "Reading is not a number."
MIN_VAL_ERR_MSG = "Reading value is lower than the minimum allowed for this "
"category."
MAX_VAL_ERR_MSG = "Reading value is higher than the maximum allowed for this "
"category."


class DBInterface:
    """Interface for MongoDB."""

    def __init__(self):
        self._client = MongoClient(f"mongodb://{MONGO_ADDRESS}:{MONGO_PORT}")
        self._db = self._client.graphTiler
        self._add_vali = Validator(ADD_SCHEMA, require_all=True)
        self._point_vali = Validator(ADD_READING_SCHEMA, require_all=True)

    def add_points(self, catname, data):
        """Add data points to the database."""
        errors, db_updates, added_points = [], [], []
        cat_info = self.get_category(catname)

        if not cat_info:
            errors.append(
                {"index": -1, "error": f'Category "{catname}" not found.'}
            )
            return {"errors": errors}
        # min_max_vali = make_min_max_vali(cat_info)
        min_val = cat_info["min"] if "min" in cat_info else None
        max_val = cat_info["max"] if "max" in cat_info else None

        if not self._add_vali.validate(data):
            errors.append({"index": -1, "error": self._add_vali.errors})
            return {"errors": errors}

        for i, point in enumerate(data["readings"]):
            if "time" not in point or "reading" not in point:
                errors.append({"index": i, "error": KEY_ERR_MSG})
                continue
            tm, reading = str_to_datetime(point["time"]), point["reading"]
            if tm is False:
                errors.append({"index": i, "error": DATE_ERR_MSG})
                continue
            point["time"] = tm
            if not isinstance(reading, int) and not isinstance(reading, float):
                errors.append({"index": i, "error": READING_ERR_MSG})
                continue
            if min_val is not None and reading < min_val:
                errors.append({"index": i, "error": MIN_VAL_ERR_MSG})
                continue
            elif max_val is not None and reading > max_val:
                errors.append({"index": i, "error": MAX_VAL_ERR_MSG})
                continue

            update = UpdateOne({"time": tm}, {"$set": point}, upsert=True)
            db_updates.append(update)
            added_points.append(point)

        if db_updates:
            self._db[f"catdata_default_{catname}"].bulk_write(db_updates)

        errors = None if not errors else errors
        return {"errors": errors, "added_points": added_points}

    def get_all_categories(self):
        """Get information on all current categories."""
        return self._db.categories.find()

    def get_category(self, catname):
        """Get information on a specific category."""
        return self._db.categories.find_one({"name": catname})

    def add_category(self, catname, data):
        """Add categories to the database."""
        colname = f"catdata_default_{catname}"
        try:
            self._db.create_collection(colname)
        except CollectionInvalid:
            return {
                "errors": {
                    "name": f'A category named "{catname}" already exists.'
                }
            }

        data["name"] = catname
        self._db.categories.insert_one(data)
        self._db[colname].create_index([("time", DESCENDING)], unique=True)
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

    def _get_and_format_points(self, points, collection, filter):
        """Get data points for a specified filter and add to dict in place."""
        for item in collection.find(filter):
            time = item["time"].strftime(TIME_FORMAT_NO_TZ)
            points[time] = item["reading"]

    def get_points(self, catname, data):
        """Get data points for a specific time or time range."""
        if self.get_category(catname) is None:
            return {"errors": f'Category "{catname}" does not exist.'}

        points = {}
        collection = self._db[f"catdata_default_{catname}"]

        if "times" in data:
            data["times"] = [
                datetime.strptime(time_str, TIME_FORMAT)
                for time_str in data["times"]
            ]
            times = data["times"]
            filter = {"time": {"$in": times}}
            self._get_and_format_points(points, collection, filter)
        if "range" in data:
            start = datetime.strptime(data["range"]["start"], TIME_FORMAT)
            end = datetime.strptime(data["range"]["end"], TIME_FORMAT)
            filter = {"time": {"$gte": start, "$lte": end}}
            self._get_and_format_points(points, collection, filter)
        if "since" in data:
            start = datetime.strptime(data["since"], TIME_FORMAT)
            filter = {"time": {"$gte": start}}
            self._get_and_format_points(points, collection, filter)

        return {"errors": None, "points": points}

    def remove_points(self, catname, data):
        """Remove datapoints from the database."""
        if self.get_category(catname) is None:
            return {"errors": f'Category "{catname}" does not exist.'}

        output = {"removed_count": 0}
        cat_data = self._db[f"catdata_default_{catname}"]

        if "times" in data:
            times = [
                datetime.strptime(time_str, TIME_FORMAT)
                for time_str in data["times"]
            ]
            res = cat_data.delete_many({"time": {"$in": times}})
            output["removed_count"] += res.deleted_count
            data["times"] = [
                (dt - dt.utcoffset()).strftime(TIME_FORMAT_NO_TZ)
                for dt in times
            ]
        if "range" in data:
            start = datetime.strptime(data["range"]["start"], TIME_FORMAT)
            end = datetime.strptime(data["range"]["end"], TIME_FORMAT)
            res = cat_data.delete_many({"time": {"$gte": start, "$lte": end}})
            output["removed_count"] += res.deleted_count
            start = (start - start.utcoffset()).strftime(TIME_FORMAT_NO_TZ)
            end = (end - end.utcoffset()).strftime(TIME_FORMAT_NO_TZ)
            data["range"]["start"] = start
            data["range"]["end"] = end
        if "since" in data:
            since = datetime.strptime(data["since"], TIME_FORMAT)
            res = cat_data.delete_many({"time": {"$gte": since}})
            output["removed_count"] += res.deleted_count
            since = (since - since.utcoffset()).strftime(TIME_FORMAT_NO_TZ)
            data["since"] = since

        output["errors"] = None
        return output

    def remove_all_points(self, catname):
        """Remove datapoints from the database."""
        cat_data = f"catdata_default_{catname}"
        res = self._db[cat_data].delete_many({})

        return {"errors": None, "removed_count": res.deleted_count}

    def get_points_range_cats(self, data):
        """Get all valid points for when a frontend category is added."""
        cat_points, now = defaultdict(dict), datetime.now(timezone.utc)
        for range_data in data:
            range = range_data["range"]
            for catname in range_data["categories"]:
                if self.get_category(catname) is None:
                    continue

                collection = self._db[f"catdata_default_{catname}"]
                rtype, points = range["range_type"], {}
                if rtype == "past":
                    amnt, unit = range["past_amount"], range["past_unit"]
                    delta = timedelta(seconds=amnt * TIME_MULTS[unit])
                    filter = {"time": {"$gte": now - delta}}
                elif rtype == "since":
                    filter = {"time": {"$gte": range["since"]}}
                elif rtype == "timerange":
                    start, end = range["start"], range["end"]
                    filter = {"time": {"$gte": start, "$lte": end}}

                self._get_and_format_points(points, collection, filter)
                cat_points[catname].update(points)

        return cat_points
