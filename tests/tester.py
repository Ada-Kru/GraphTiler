from requests import get, post
import sys

cat_name = sys.argv[1] if len(sys.argv) == 2 else "PCBandwidth"

resp = post(url=f"http://192.168.2.111:7123/remove-category/{cat_name}")
print(resp, resp.json())

data = {
    "displayName": "Bandwidth",
    "units": "Bytes",
    "abrvUnit": "b",
    "decimalPlaces": 0,
    "min": 0,
    "max": 1000000,
}


resp = post(url=f"http://192.168.2.111:7123/category/{cat_name}", json=data)
print(resp, resp.json())
#
# data["min"] = 10
# data["max"] = 20
# # data.pop("min")
# # data.pop("units")
#
# resp = post(
#     url=f"http://192.168.2.111:7123/modify-category/{cat_name}", json=data
# )
# print(resp, resp.json())
#
# resp = get(url=f"http://192.168.2.111:7123/category/{cat_name}")
# print(resp, resp.json())


data = {
    "readings": [
        {"time": "2019-10-22 09:15:00 -0600", "reading": 10000},
        {"time": "2019-10-22 09:16:10 -0600", "reading": 60000},
        {"time": "2019-10-22 09:17:20 -0600", "reading": 30000},
        {"time": "2019-10-22 09:18:30 -0600", "reading": 50000},
        {"time": "2019-10-22 09:14:40 -0600", "reading": 40000},
        {"time": "2019-10-22 09:19:50 -0600", "reading": 20000},
    ]
}
resp = post(
    url=f"http://192.168.2.111:7123/category/{cat_name}/add", json=data
)
print(resp, resp.json())

# data = {"reading": 80}
#
# resp = post(
#     url=f"http://192.168.2.111:7123/category/{cat_name}/now", json=data
# )
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
#     url=f"http://192.168.2.111:7123/category/{cat_name}/remove", json=data
# )
# print(resp, resp.json())

# resp = post(url=f"http://192.168.2.111:7123/category/{cat_name}/remove-all")
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
#     url=f"http://192.168.2.111:7123/category/{cat_name}/get-points", json=data
# )
# print(resp, resp.json())
