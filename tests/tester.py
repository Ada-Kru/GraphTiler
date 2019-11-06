from requests import get, post


resp = post(url="http://192.168.2.111:7123/remove-category/PCBandwidth")
print(resp, resp.json())

data = {
    "displayName": "Bandwidth",
    "units": "Bytes",
    "abrvUnit": "b",
    "decimalPlaces": 0,
    "min": 0,
    "max": 1000000,
}


resp = post(url="http://192.168.2.111:7123/category/PCBandwidth", json=data)
print(resp, resp.json())
#
# data["min"] = 10
# data["max"] = 20
# # data.pop("min")
# # data.pop("units")
#
# resp = post(
#     url="http://192.168.2.111:7123/modify-category/PCBandwidth", json=data
# )
# print(resp, resp.json())
#
# resp = get(url="http://192.168.2.111:7123/category/PCBandwidth")
# print(resp, resp.json())


data = {
    "readings": [
        {"time": "2019-10-22 09:15 -0600", "reading": 50000},
        {"time": "2019-10-22 09:16 -0600", "reading": 60000},
        {"time": "2019-10-22 09:17 -0600", "reading": 70000},
        {"time": "2019-10-22 09:18 -0600", "reading": 80000},
    ]
}
resp = post(
    url="http://192.168.2.111:7123/category/PCBandwidth/add", json=data
)
print(resp, resp.json())

# data = {"reading": 80}
#
# resp = post(
#     url="http://192.168.2.111:7123/category/PCBandwidth/now", json=data
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
#     url="http://192.168.2.111:7123/category/PCBandwidth/remove", json=data
# )
# print(resp, resp.json())

# resp = post(url="http://192.168.2.111:7123/category/PCBandwidth/remove-all")
# print(resp, resp.json())

data = {
    "times": ["2019-10-22 09:15 -06:00"],
    "range": {
        "start": "2019-10-22 09:16 -06:00",
        "end": "2019-10-22 09:17 -0600",
    }
}

resp = post(
    url="http://192.168.2.111:7123/category/PCBandwidth/get-points", json=data
)
print(resp, resp.json())
