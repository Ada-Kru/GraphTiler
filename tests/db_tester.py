from pymongo import MongoClient


client = MongoClient("mongodb://localhost:7000")
db = client.graphTiler
print(client.list_database_names())
print(db.list_collection_names())
# categories = db["default-cat-pcbandwidth"]
# categories.insert_one({"2019-10-24 9:15": 12435434})

# cursor = db["default-cat-pcbandwidth"].find()
# for item in cursor:
#     print(item)