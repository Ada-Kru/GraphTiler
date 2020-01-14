from cerberus import Validator
from .validation_funcs import cat_name_vali, date_vali


STRING_MAX_100 = {"type": "string", "minlength": 1, "maxlength": 100}
STRING_LIST = {"type": "list", "empty": True, "schema": STRING_MAX_100}
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

PAST_RANGE_SCHEMA = {
    "range_type": {"type": "string", "required": True, "allowed": ["past"]},
    "past_amount": {"type": "integer", "required": True, "min": 1},
    "past_unit": {
        "type": "string",
        "required": True,
        "allowed": ["hr", "min", "sec"],
    },
}
SINCE_RANGE_SCHEMA = {
    "range_type": {"type": "string", "required": True, "allowed": ["since"]},
    "since": {"required": True, **DATE_STR},
}
TIMERANGE_RANGE_SCHEMA = {
    "range_type": {
        "type": "string",
        "required": True,
        "allowed": ["timerange"],
    },
    "start": {"type": "string", "check_with": date_vali, "required": True},
    "end": {"type": "string", "check_with": date_vali, "required": True},
}

WS_MSG_SCHEMA = {
    "add_categories": {
        "type": "list",
        "schema": {
            "type": "dict",
            "schema": {
                "unique_id": {"required": True, **STRING_MAX_100},
                "categories": {"required": True, **STRING_LIST},
                "range": {
                    "type": "dict",
                    "required": True,
                    "anyof_schema": [
                        PAST_RANGE_SCHEMA,
                        SINCE_RANGE_SCHEMA,
                        TIMERANGE_RANGE_SCHEMA,
                    ],
                },
            },
        },
    },
    "remove_categories": {
        "type": "list",
        "schema": {
            "type": "dict",
            "schema": {"unique_id": STRING_MAX_100, "categories": STRING_LIST},
        },
    },
}

LAYOUT_SCHEMA = {"name": STRING_MAX_100}

LAYOUT_WITH_DATA_SCHEMA = {
    **LAYOUT_SCHEMA,
    "data": {"required": True, "type": "dict"},
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
