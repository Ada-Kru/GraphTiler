from quart.json import JSONEncoder
from re import Pattern
from .monitored_requester import MonitoredRequester
from .hit import ArchivedHit


class HSEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, MonitoredRequester):
            return obj.to_json()
        elif isinstance(obj, Pattern):
            return obj.pattern
        elif isinstance(obj, ArchivedHit):
            return obj.create_display_dict()
        return JSONEncoder.default(self, obj)
