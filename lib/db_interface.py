from datetime import datetime

# import cfg


class DBInterface:
    """Interface for MongoDB."""

    def __init__(self):
        pass

    def add_points():
        """Add data points to the database."""
        pass

    def remove_points():
        """Remove datapoints from the database."""
        pass

    def get_categories():
        """Get information on the current categories."""
        return {
            "bandwidth": {"units": "bytes"},
            "temperatureF": {"units": "degrees Farenheit"},
            "temperatureC": {"units": "degrees Celcius"},
        }

    def add_categories():
        """Get information on the current categories."""
        pass

    def remove_categories():
        """Remove categories."""
        pass
