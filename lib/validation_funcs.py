from datetime import datetime
import cfg


def category_name_validator(field, value, error):
    if not value.isalnum():
        error(field, "Field may only contain letters and numbers.")


def gt_date_format_validator(field, value, error):
    try:
        datetime.strptime(value, cfg.TIME_FORMAT)
        return True
    except ValueError:
        error(
            field,
            f"Bad date time format: {value}  Date format must be "
            "YYYY-MM-DD HH:MM.  All numbers must have leading zeros and hours "
            "are in 24 hour format.",
        )
