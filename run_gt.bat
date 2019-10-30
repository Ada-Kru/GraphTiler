pushd C:\Adamu\txt\Python\GraphTiler\
hypercorn -b 192.168.2.111:7123 --workers 1 GraphTiler:app