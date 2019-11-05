from datetime import datetime
import cfg


def cat_name_vali(field, value, error):
    if not value.isalnum():
        error(field, "Field may only contain letters and numbers.")


def date_vali(field, value, error):
    try:
        datetime.strptime(value, cfg.TIME_FORMAT)
        return True
    except ValueError:
        error(
            field,
            f"Bad date time format: {value}  Date format must be "
            "'YYYY-MM-DD HH:MM ±HHMM' where '±HHMM' is the time zone offset "
            "(ex. '-0600' for central time). All numbers must have leading "
            "zeros and hours are in 24 hour format.",
        )
