import re
from .monitored_requester import MonitoringModes

NON_ALPHANUMERIC_REGEX = re.compile("[^a-z0-9]", re.I)
match_iso8601 = re.compile(
    r"^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):"
    "([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])?$"
)


def is_positive_int(num):
    return isinstance(num, int) and num >= 0


def is_positive_float(num):
    return (isinstance(num, float) or isinstance(num, int)) and num >= 0


def is_positive_int_str(txt):
    return isinstance(txt, str) and txt.isdigit()


def is_positive_float_str(txt):
    return isinstance(txt, str) and txt.replace(".", "", 1).isdigit()


def is_valid_operator(txt):
    return isinstance(txt, str) and txt in (">=", "=", "<=")


def input_contains_text(txt):
    return isinstance(txt, str) and len(txt.strip())


def is_valid_time_hhmm(txt):
    if not isinstance(txt, str):
        return False
    hhmm = txt.split(":")
    if len(hhmm) != 2:
        return False
    if not (
        hhmm[0].isdigit()
        and len(hhmm[0]) == 2
        and hhmm[1].isdigit()
        and len(hhmm[1]) == 2
    ):
        return False
    if not (0 <= int(hhmm[0]) <= 23 and 0 <= int(hhmm[1]) <= 59):
        return False
    return True


def is_valid_iso8601(txt):
    try:
        if match_iso8601.match(txt) is not None:
            return True
    except:
        return False
    return False


def is_valid_yyyymmdd(txt):
    if not isinstance(txt, str):
        return False
    txt = txt.split("-")
    if len(txt) != 3 or (
        len(txt[0]) != 4 or len(txt[1]) != 2 or len(txt[2]) != 2
    ):
        return False
    for t in txt:
        if not t.isdigit():
            return False
    return 1 <= int(txt[1]) <= 12 and 1 <= int(txt[2]) <= 31


def is_valid_mmddyyyy(txt):
    if not isinstance(txt, str):
        return False
    txt = txt.split("-")
    if len(txt) != 3 or (
        len(txt[0]) != 2 or len(txt[1]) != 2 or len(txt[2]) != 4
    ):
        return False
    for t in txt:
        if not t.isdigit():
            return False
    return 1 <= int(txt[0]) <= 12 and 1 <= int(txt[1]) <= 31


def is_valid_regex(txt):
    try:
        re.compile(txt)
        return True
    except (re.error, SyntaxError):
        return False


def acceptable_regex_input(data):
    return data is None or data.strip() == "" or is_valid_regex(data)


def is_valid_monitoring_mode(mode):
    if isinstance(mode, str):
        if not mode.isdigit():
            return False
        mode = int(mode)
    return MonitoringModes.contains(mode)


def is_valid_turk_id(req_id):
    return not (len(req_id) > 40 or NON_ALPHANUMERIC_REGEX.match(req_id))
