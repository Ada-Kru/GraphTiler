from requests import get, post
from datetime import timedelta, datetime
from random import randrange
import sys

TIME_FORMAT_NO_TZ = "%Y-%m-%d %H:%M:%S"
TIME_FORMAT = TIME_FORMAT_NO_TZ + " %z"
CAT_NAME = sys.argv[1] if len(sys.argv) == 2 else "PCBandwidth"


def random_date(start, end):
    delta = end - start
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = randrange(int_delta)
    return start + timedelta(seconds=random_second)


resp = post(url=f"http://192.168.2.111:7123/remove-category/{CAT_NAME}")
print(resp, resp.json())

data = {
    "displayName": "Bandwidth",
    "units": "Bytes",
    "abrvUnit": "b",
    "decimalPlaces": 0,
    "min": 0,
    "max": 1000000,
}

#
resp = post(url=f"http://192.168.2.111:7123/category/{CAT_NAME}", json=data)
print(resp, resp.json())

# data["min"] = 10
# data["max"] = 20
# # data.pop("min")
# # data.pop("units")
#
# resp = post(
#     url=f"http://192.168.2.111:7123/modify-category/{CAT_NAME}", json=data
# )
# print(resp, resp.json())
#
# resp = get(url=f"http://192.168.2.111:7123/category/{CAT_NAME}")
# print(resp, resp.json())


start = datetime.strptime("2019-10-01 01:00:00 -0600", TIME_FORMAT)
end = datetime.strptime("2019-10-30 01:00:00 -0600", TIME_FORMAT)

readings = []
for _ in range(1000):
    dt = random_date(start, end).strftime(TIME_FORMAT)
    readings.append({"time": dt, "reading": randrange(60000)})
data = {"readings": readings}

# data = {
#     "readings": [
#         {"time": "2019-10-22 09:15:00 -0600", "reading": 10000},
#         {"time": "2019-10-22 09:16:10 -0600", "reading": 60000},
#         {"time": "2019-10-22 09:17:20 -0600", "reading": 30000},
#         {"time": "2019-10-22 09:18:30 -0600", "reading": 50000},
#         {"time": "2019-10-22 09:14:40 -0600", "reading": 40000},
#         {"time": "2019-10-22 09:19:50 -0600", "reading": 20000},
#     ]
# }
resp = post(
    url=f"http://192.168.2.111:7123/category/{CAT_NAME}/add", json=data
)
print(resp, resp.json())

# data = {"reading": 80}
#
# resp = post(
#     url=f"http://192.168.2.111:7123/category/{CAT_NAME}/now", json=data
# )
# print(resp, resp.json())

# data = {
#     "times": ["2019-10-22 09:15:00 -06:00"],
#     "range": {
#         "start": "2019-10-22 09:16:10 -06:00",
#         "end": "2019-10-22 09:17:20 -0600",
#     },
# }
#
# resp = post(
#     url=f"http://192.168.2.111:7123/category/{CAT_NAME}/remove", json=data
# )
# print(resp, resp.json())

# resp = post(url=f"http://192.168.2.111:7123/category/{CAT_NAME}/remove-all")
# print(resp, resp.json())

# data = {
#     "times": ["2019-10-22 09:15 -06:00"],
#     "range": {
#         "start": "2019-10-22 09:16 -06:00",
#         "end": "2019-10-22 09:17 -0600",
#     }
# }
#
# resp = post(
#     url=f"http://192.168.2.111:7123/category/{CAT_NAME}/get-points", json=data
# )
# print(resp, resp.json())
