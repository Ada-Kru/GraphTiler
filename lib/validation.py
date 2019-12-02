from cerberus import Validator
from .validation_funcs import cat_name_vali, date_vali


STRING_MAX_100 = {"type": "string", "minlength": 1, "maxlength": 100}
DATE_STR = {"type": "string", "check_with": date_vali}
ADD_SCHEMA = {"readings": {"type": "list"}}
ADD_READING_SCHEMA = {
    "time": {"type": "string", "check_with": date_vali},
    "reading": {"type": "number"},
}
CAT_NAME_SCHEMA = {
    "name": {
        "type": "string",
        "check_with": cat_name_vali,
        "minlength": 1,
        "maxlength": 63,
    }
}
NEW_CAT_SCHEMA = {
    "displayName": STRING_MAX_100,
    "units": STRING_MAX_100,
    "abrvUnit": STRING_MAX_100,
    "decimalPlaces": {"type": "integer", "min": 0, "max": 20},
    "min": {"type": "number", "required": False},
    "max": {"type": "number", "required": False},
}
POINT_DATA_SCHEMA = {"times": {"type": "list", "items": [DATE_STR]}}
GET_REMOVE_POINTS_SCHEMA = {
    "times": {"type": "list", "schema": DATE_STR},
    "range": {"type": "dict", "schema": {"start": DATE_STR, "end": DATE_STR}},
    "since": DATE_STR,
}

WS_MSG_SCHEMA = {
    "add_categories": {
        "type": "dict",
        "allow_unknown": True,
        "valuesrules": {
            "type": "dict",
            "valuesrules": {
                "type": "dict",
                "schema": {
                    "start": {
                        "type": "string",
                        "check_with": date_vali,
                        "dependencies": "end",
                    },
                    "end": {
                        "type": "string",
                        "check_with": date_vali,
                        "dependencies": "start",
                    },
                    "since": DATE_STR,
                },
            },
        },
    },
    "remove_categories": {
        "type": "list",
        "valuesrules": {"type": "dict", "schema": {"type": "string"}},
    },
}


def make_min_max_vali(cat_info):
    min_max = {}
    if "min" in cat_info:
        min_max["min"] = cat_info["min"]
    if "max" in cat_info:
        min_max["max"] = cat_info["max"]
    return Validator(
        {"reading": {"type": "number", **min_max}}, allow_unknown=True
    )
