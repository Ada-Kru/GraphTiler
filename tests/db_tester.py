from pymongo import MongoClient


client = MongoClient("mongodb://localhost:7000")
db = client.graphTiler
print(client.list_database_names())
print(db.list_collection_names())
print(db.categories)
# db.categories.delete_many({})
# cursor = db.categories.find_one({"name": "PCBandwidth"})
# print(cursor)
# for item in cursor:
#     print(item)

# category_data = db.catdata_default
# category_data.insert_one({"2019-10-24 09:15 -0600": 12435434})
# category_data.delete_many({})

cursor = db.catdata_default_PCBandwidth.find()
for item in cursor:
    print(item)
