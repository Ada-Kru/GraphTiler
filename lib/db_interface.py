from pymongo import MongoClient
import cfg


class DBInterface:
    """Interface for MongoDB."""

    def __init__(self):
        self._client = MongoClient(
            f"mongodb://{cfg.MONGO_ADDRESS}:{cfg.MONGO_PORT}"
        )
        self._db = self._client.graphTiler

    def add_points(self, catname, data):
        """Add data points to the database."""
        errors = []
        categories = {}

        for reading in data["readings"]:
            category = reading["category"]
            if category not in categories:
                cat_info = self.get_category(reading["category"])
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
        return {"errors": None}

    def remove_category(self, catname):
        """Remove category."""
        self._db.categories.delete_one({"name": catname})
        self._client.drop_database(f"default-cat-{catname}")
        return {"errors": None}
