from datetime import datetime
from pymongo import MongoClient
import cfg


class DBInterface:
    """Interface for MongoDB."""

    def __init__(self):
        self._client = MongoClient(
            f"mongodb://{cfg.MONGO_ADDRESS}:{cfg.MONGO_PORT}"
        )
        self._db = self._client.graphTiler

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
                    errors.append(f"Category \"{category}\" not found.")
                    continue

            # VALIDATE HERE
            self._db[f"default-cat-{category}"].insert_one(
                {reading["time"]: reading["reading"]}
            )

        return {"errors": None if not errors else errors}

    def remove_points(self):
        """Remove datapoints from the database."""
        pass

    def _get_category(self, name):
        """Get information on the current categories."""
        return self._db.categories.find_one(name)
        # {
        #     "bandwidth": {
        #         "units": "bytes",
        #         "abrv_unit": "b",
        #         "schema": {"type": "integer", "min": 0},
        #     },
        #     "temperatureF": {
        #         "units": "Degrees Farenheit",
        #         "abrv_unit": "°F",
        #         "schema": {"type": "number"},
        #     },
        #     "temperatureC": {
        #         "units": "Degrees Celcius",
        #         "abrv_unit": "°C",
        #         "schema": {"type": "number"},
        #     },
        # }

    def add_category(self, data):
        """Add categories to the database."""
        self._db.categories.insert_one(data)
        return {"errors": None}

    def remove_categories(self):
        """Remove categories."""
        pass
