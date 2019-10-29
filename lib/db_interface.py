from pymongo import MongoClient
from lib.validation import db_name_validator, new_category_validator
import cfg


class DBInterface:
    """Interface for MongoDB."""

    def __init__(self):
        self._client = MongoClient(
            f"mongodb://{cfg.MONGO_ADDRESS}:{cfg.MONGO_PORT}"
        )
        self._db = self._client.graphTiler
        self._new_cat_validator = new_category_validator
        self._db_name_validator = db_name_validator

    def add_points(self, data):
        """Add data points to the database."""
        errors = []
        categories = {}

        for reading in data["readings"]:
            category = reading["category"]
            if category not in categories:
                cat_info = self._get_category(reading["category"])
                if cat_info:
                    categories[category] = cat_info
                else:
                    errors.append(f'Category "{category}" not found.')
                    continue

            # VALIDATE HERE
            self._db[f"default-cat-{category}"].insert_one(
                {reading["time"]: reading["reading"]}
            )

        return {"errors": None if not errors else errors}

    def remove_points(self):
        """Remove datapoints from the database."""
        pass

    def get_category(self, catname):
        """Get information on the current categories."""
        return self._db.categories.find_one({"name": catname})
        # {
        #     "bandwidth": {
        #         "displayName": "Bandwidth",
        #         "units": "Bytes",
        #         "abrvUnit": "b",
        #         "decimalPlaces": 0,
        #     },
        #     "temperatureF": {
        #         "displayName": "Temperature (F)",
        #         "units": "Degrees Farenheit",
        #         "abrvUnit": "°F",
        #         "decimalPlaces": 1,
        #     },
        #     "temperatureC": {
        #         "displayName": "Temperature (C)",
        #         "units": "Degrees Celcius",
        #         "abrvUnit": "°C",
        #         "decimalPlaces": 1,
        #     },
        # }

    def add_category(self, data):
        """Add categories to the database."""
        if not self._new_cat_validator.validate(data):
            return {"errors": self._new_cat_validator.errors}

        catname = data["name"]
        if self.get_category(catname):
            return {
                "errors": {
                    "name": f'A category named "{catname}" already exists.'
                }
            }
        self._db.categories.insert_one(data)
        return {"errors": None}

    def remove_category(self, name):
        """Remove category."""
        self._client.drop_database(name)
        return {"errors": None}
