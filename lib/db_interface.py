from pymongo import MongoClient, UpdateOne
from lib.validation import (
    reading_validator,
    add_validator,
    make_min_max_validator,
)
import cfg


class DBInterface:
    """Interface for MongoDB."""

    def __init__(self):
        self._client = MongoClient(
            f"mongodb://{cfg.MONGO_ADDRESS}:{cfg.MONGO_PORT}"
        )
        self._db = self._client.graphTiler
        self._add_validator = add_validator
        self._reading_validator = reading_validator

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
        min_max_validator = make_min_max_validator(cat_info)

        if not self._add_validator.validate(data):
            errors.append({"index": -1, "error": self._add_validator.errors})
            return {"errors": errors}

        for i, reading in enumerate(data["readings"]):
            if not self._reading_validator.validate(reading):
                errors.append(
                    {"index": i, "error": self._reading_validator.errors}
                )
            elif not min_max_validator.validate(reading):
                errors.append({"index": i, "error": min_max_validator.errors})
            else:
                update = UpdateOne(
                    {"time": reading["time"]}, {"$set": reading}, upsert=True
                )
                updates.append(update)

        if updates:
            self._db[f"catdata_default_{catname}"].bulk_write(updates)

        return {"errors": None} if not errors else {"errors": errors}


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
        return {"errors": None}

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
        return {"errors": None}

    def remove_category(self, catname):
        """Remove a category."""
        if self.get_category(catname) is None:
            return {
                "errors": {"name": f'Category "{catname}" does not exist.'}
            }
        self._db.categories.delete_one({"name": catname})
        self._db[f"catdata_default_{catname}"].drop()
        return {"errors": None}

    def get_points(self, catname, data):
        points = []

    def remove_points(self, catname, times):
        """Remove datapoints from the database."""
        cat_data = f"catdata_default_{catname}"
        res = self._db[cat_data].delete_many({"time": {"$in": times}})

        if res.deleted_count == len(times):
            return {"errors": None, "removed_count": res.deleted_count}
        err = f"{len(times) - res.deleted_count} time points not found."
        return {"errors": err, "removed_count": res.deleted_count}

    def remove_all_points(self, catname):
        """Remove datapoints from the database."""
        cat_data = f"catdata_default_{catname}"
        res = self._db[cat_data].delete_many({})

        return {"errors": None, "removed_count": res.deleted_count}
