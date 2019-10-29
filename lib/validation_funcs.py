def category_name_validator(field, value, error):
    if not value.isalnum():
        error(field, "Field may only contain letters and numbers.")
