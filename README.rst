===========
GraphTiler
===========

Display multiple configurable graphs at once with real-time data updates from a database.

* Graphs can be rearranged and resized.
* Multiple datasets can be displayed on the same graph with live updates.
* Layouts can be saved and restored.
* React & Redux frontend, SASS, Chart.js graphs.
* Quart (Flask compatible) backend with RESTful API and Cerberus for data validation.
* MongoDB database.
* For Python 3.7 and up
* MIT License


Demo
----

`Demonstration Video <https://youtu.be/7F43OCp4Ffk>`_


Installation
------------
1. Install `MongoDB <https://www.mongodb.com>`_ .

2. Clone this repository.

3. Run::

    python setup.py

4. Modify cfg.py to set your choice of IP address for the server and database.

5. From the install directory run the following replacing "YOUR_SERVER_ADDRESS" with the ip:port that you chose in step 4::

    hypercorn -b YOUR_SERVER_ADDRESS --reload --workers 1 GraphTiler:app


API Reference
-------------
[GET]  /category/

Returns a list of all categories.

.. code-block:: python
    from requests import get, post

    resp = get(url="http://localhost:7123/category/")
    print(resp.json())

[GET, POST]  /category/<name>

GET to get data for a specific category or POST to create a new category.
.. code-block:: python
    from requests import get, post

    cat_name = "fanSpeed"
    data = {
        "displayName": "Fan Speed",
        "units": "Rotations Per Minute",
        "abrvUnit": "RPM",
        "decimalPlaces": 0,
        "min": 0,
        "max": 10000,
    }

    # Create a new category.
    resp = post(url=f"http://localhost:7123/category/{cat_name}", json=data)
    print(resp.json())

    # Retrieve information about the newly created category.
    resp = get(url=f"http://localhost:7123/category/{cat_name}")
    print(resp.json())


[POST]  /modify-category/<name> :

Modify category information.

.. code-block:: python
    from requests import get, post

    cat_name = "fanSpeed"
    data = {
        "displayName": "Fan Rotation Speed",
        "units": "RPM",
        "abrvUnit": "RPM",
        "decimalPlaces": 2,
        "min": 10,
        "max": 20000,
    }

    resp = post( url=f"http://localhost:7123/modify-category/{cat_name}",
                 json=data )
    print(resp.json())


[POST]  /remove-category/<name>

Remove a category and all associated data points.

.. code-block:: python
    from requests import get, post

    cat_name = "fanSpeed"
    resp = post(url=f"http://localhost:7123/remove-category/{cat_name}")
    print(resp.json())


[POST]  /category/<name>/now :

Add a single data point for the current time.

.. code-block:: python
    from requests import get, post

    cat_name = "fanSpeed"
    data = {"reading": 500}

    # Get data for specific time points.
    # data = { "times": ["2019-10-22 09:15:00 -06:00",
    #                    "2019-10-22 09:16:05 -06:00"] }

    resp = post(url=f"http://localhost:7123/category/{cat_name}/now")
    print(resp.json())


[POST]  /category/<name>/add :

Add data points for the specified times.

.. code-block:: python
    from requests import get, post

    cat_name = "fanSpeed"
    data = {
        "readings": [
            {"time": "2019-10-22 09:15:00 -0600", "reading": 500},
            {"time": "2019-10-22 09:16:10 -0600", "reading": 600},
            {"time": "2019-10-22 09:17:20 -0600", "reading": 300},
            {"time": "2019-10-22 09:18:30 -0600", "reading": 400},
            {"time": "2019-10-22 09:14:40 -0600", "reading": 475},
            {"time": "2019-10-22 09:19:50 -0600", "reading": 800},
        ]
    }

    resp = post(url=f"http://localhost:7123/category/{cat_name}/add", json=data)
    print(resp.json())

[POST]  /category/<name>/get-points :

Get data points for a category for a time range or specific times.

.. code-block:: python
    from requests import get, post

    cat_name = "fanSpeed"
    data = {
        "range": {
            "start": "2019-10-22 09:00:00 -06:00",
            "end": "2019-10-22 14:00:00 -0600",
        }
    }

    # Get data for specific time points.
    # data = { "times": ["2019-10-22 09:15:00 -06:00",
    #                    "2019-10-22 09:16:05 -06:00"] }

    resp = post( url=f"http://localhost:7123/category/{cat_name}/get-points",
                 json=data )
    print(resp.json())


[POST]  /category/<name>/remove :

Remove data points for a category for a time range or specific times.

.. code-block:: python
    from requests import get, post

    cat_name = "fanSpeed"
    data = {
        "range": {
            "start": "2019-10-22 09:00:00 -06:00",
            "end": "2019-10-22 14:00:00 -0600",
        }
    }

    # Remove data points for specific time points.
    # data = { "times": ["2019-10-22 09:15:00 -06:00",
    #                    "2019-10-22 09:16:05 -06:00"] }

    resp = post( url=f"http://localhost:7123/category/{cat_name}/remove",
                 json=data )
    print(resp.json())


[POST]  /category/<name>/remove-all :

Remove all data points for a category.

.. code-block:: python
    from requests import get, post

    cat_name = "fanSpeed"

    resp = post(url=f"http://localhost:7123/category/{cat_name}/remove-all")
    print(resp.json())
