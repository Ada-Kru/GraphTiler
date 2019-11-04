from cerberus import Validator
from .validation_funcs import category_name_validator, gt_date_format_validator

ADD_SCHEMA = {"readings": {"type": "list"}}

ADD_READING_SCHEMA = {
    "time": {"type": "string", "check_with": gt_date_format_validator},
    "reading": {"type": "number"},
}

DB_NAME_SCHEMA = {
    "name": {
        "type": "string",
        "check_with": category_name_validator,
        "minlength": 1,
        "maxlength": 63,
    }
}

NEW_CAT_SCHEMA = {
    "displayName": {"type": "string", "minlength": 1, "maxlength": 100},
    "units": {"type": "string", "minlength": 1, "maxlength": 100},
    "abrvUnit": {"type": "string", "minlength": 1, "maxlength": 100},
    "decimalPlaces": {"type": "integer", "min": 0, "max": 20},
    "min": {"type": "number", "required": False},
    "max": {"type": "number", "required": False},
}

POINT_DATA_SCHEMA = {"times": {"type": "list", "items": [{"type": "string"}]}}

db_name_validator = Validator(DB_NAME_SCHEMA, require_all=True)
new_category_validator = Validator(NEW_CAT_SCHEMA, require_all=True)
add_validator = Validator(ADD_SCHEMA, require_all=True)
reading_validator = Validator(ADD_READING_SCHEMA, require_all=True)
points_data_validator = Validator(POINT_DATA_SCHEMA, require_all=True)


def make_min_max_validator(cat_info):
    min_max = {}
    if "min" in cat_info:
        min_max["min"] = cat_info["min"]
    if "max" in cat_info:
        min_max["max"] = cat_info["max"]
    return Validator(
        {"reading": {"type": "number", **min_max}}, allow_unknown=True
    )


def is_valid_year_month_day(year, month, day):
    return True
