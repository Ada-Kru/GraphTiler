from pymongo import MongoClient
from lib.validation import reading_validator, add_validator
import cfg

NO_ERRORS = {"errors": None}


class DBInterface:
    """Interface for MongoDB."""

    def __init__(self):
        self._client = MongoClient(
            f"mongodb://{cfg.MONGO_ADDRESS}:{cfg.MONGO_PORT}"
        )
        self._db = self._client.graphTiler
        self._cat_data = self._db.catdata_default
        self._add_validator = add_validator
        self._reading_validator = reading_validator

    def add_points(self, catname, data):
        """Add data points to the database."""
        errors = []
        cat_info = self.get_category(catname)
        if not cat_info:
            errors.append(
                {"index": -1, "error": f'Category "{catname}" not found.'}
            )
            return {"errors": errors}

        if not self._add_validator.validate(data):
            errors.append({"index": -1, "error": self._add_validator.errors})
            return {"errors": errors}

        for i, reading in enumerate(data["readings"]):
            if self._reading_validator.validate(reading):
                reading["category"] = catname
                self._cat_data.update_one(
                    {"time": reading["time"]}, {"$set": reading}, upsert=True
                )
            else:
                errors.append(
                    {"index": i, "error": self._reading_validator.errors}
                )

        return NO_ERRORS if not errors else {"errors": errors}

    def remove_points(self, catname):
        """Remove datapoints from the database."""
        pass

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
        return NO_ERRORS

    def modify_category(self, catname, data):
        """
        Modify an existing category.

        Does not make any changes to the data points for the category.
        """
        if not self.get_category(catname):
            return {
                "errors": {"name": f'No category named "{catname}" exists.'}
            }
        self._db.categories.delete_one({"name": catname})
        data["name"] = catname
        self._db.categories.insert_one(data)
        return NO_ERRORS

    def remove_category(self, catname):
        """Remove a category."""
        self._db.categories.delete_one({"name": catname})
        self._cat_data.delete_many({"category": catname})
        return NO_ERRORS
