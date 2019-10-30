from quart.json import JSONEncoder
from re import Pattern
from .monitored_requester import MonitoredRequester
from .hit import ArchivedHit


class GTJSONEncoder(JSONEncoder):
    """JSON encoder for GraphTiler."""

    def default(self, obj):
        """JSON encoder for GraphTiler."""
        if isinstance(obj, MonitoredRequester):
            return obj.to_json()
        elif isinstance(obj, Pattern):
            return obj.pattern
        elif isinstance(obj, ArchivedHit):
            return obj.create_display_dict()
        return JSONEncoder.default(self, obj)
