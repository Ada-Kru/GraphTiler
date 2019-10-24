from requests import post

# data = {"user": "defaultUser",
#         "category": "bandwidth",
#         "reading": 50000}
# resp = post(url="http://192.168.2.111:6000/timepoints/now", json=data)

data = {
    # "user": "default",
    "readings": [
        {
            "category": "pcbandwidth",
            "time": "2019/10/22 09:15",
            "reading": 50000,
        },
        {
            "category": "pcbandwidth",
            "time": "2019/10/22 09:16",
            "reading": 60000,
        }
    ],
}

resp = post(url="http://192.168.2.111:6000/timepoints/add", json=data)
