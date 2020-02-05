import setuptools

with open("README.rst", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name="graphTiler",
    version="0.9.0.0",
    author="Adam Krueger",
    author_email="adamkru@gmail.com",
    description=(
        "Display multiple configurable graphs at once with real-time data "
        "updates from a database."
    ),
    long_description=long_description,
    long_description_content_type="text/x-rst",
    url="https://github.com/Ada-Kru/GraphTiler",
    keywords="GraphTiler Graph chart quart flask react redux sass chartjs "
             "mongodb",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Intended Audience :: Developers",
        "Natural Language :: English",
    ],
    python_requires=">=3.7",
    install_requires=["pymongo", "quart", "cerberus"],
)
