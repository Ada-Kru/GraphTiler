from datetime import datetime
import cfg


def cat_name_vali(field, value, error):
    if not value.isalnum():
        error(field, "Field may only contain letters and numbers.")


def str_to_datetime(day_str):
    try:
        return datetime.strptime(day_str, cfg.TIME_FORMAT)
    except (ValueError, TypeError):
        return False


def date_vali(field, value, error):
    if str_to_datetime(value):
        return True
    error(
        field,
        f"Bad date time format: '{value}'  Date format must be "
        "'YYYY-MM-DD HH:MM ±HHMM' where '±HHMM' is the time zone offset (ex. "
        "'2020-01-20 18:45 -0600'). All numbers must have leading zeros and "
        "hours are in 24 hour format.",
    )
