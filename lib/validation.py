from cerberus import Validator
from .validation_funcs import category_name_validator

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

db_name_validator = Validator(DB_NAME_SCHEMA, require_all=True)
new_category_validator = Validator(NEW_CAT_SCHEMA, require_all=True)


def is_valid_year_month_day(year, month, day):
    return True
