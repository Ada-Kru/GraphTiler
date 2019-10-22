import re
import datetime


def make_regex(regex):
    return (
        None
        if regex is None or regex == "" or regex.strip() == ""
        else re.compile(regex.strip(), re.I)
    )


def hhmm_between_range(start, end, now=None):
    if not now:
        now = datetime.datetime.now().time()
    start = datetime.time(*[int(unit) for unit in start.split(":")])
    end = datetime.time(*[int(unit) for unit in end.split(":")])
    if start <= end:
        return start <= now <= end
    else:
        return start <= now or now <= end


def sort_group_list(groups):
    groups.sort(key=lambda hit: hit["requester"].casefold())


def parse_rejects(approval_rate):
    if approval_rate[0] == "≥":
        return 1

    reject_rate = 0
    for char in approval_rate:
        if char.isdigit():
            reject_rate *= 10
            reject_rate += int(char)
        elif char == "%":
            break
    return 100 - reject_rate if reject_rate != 0 else 0
