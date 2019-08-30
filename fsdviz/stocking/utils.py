def form2params(formdata):
    """A helper function for our form to find specific stocking events. It
    takes a dictionary (form.cleaned_data), and returns a url query string
    that contains the query parameter values. If no values are selected,
    an empty string is returned.

    Arguments:

    - `formdata`: A dictionary containing the fields:selected values
      pairs returned from the 'find_events_form'.

    """

    params = []

    for key, value in formdata.items():
        if value:
            if isinstance(value, int):
                value = str(value)

            if isinstance(value, list):
                tmp = ",".join([str(x) for x in value])
            else:
                tmp = value
            params.append("{}={}".format(key, tmp))

    if len(params) >= 1:
        return "?" + "&".join(params)
    else:
        return ""


def to_lake_dict(object_list):
    """A little helper function that takes a list of two element objects
    and return a dictionary of lists. The first element of each tuple
    forms the key, teh second is added to the list for that key value.
    Used to create lake specific list of stat_districts and grids.

    Arguments:
    - `object_list`:

    """

    object_dict = {}
    for item in object_list:
        values = object_dict.get(item[0])
        if values:
            values.append(item[1])
        else:
            values = [item[1]]
        object_dict[item[0]] = values

    # convert our flat lists into lists of two element tuples
    for key, value in object_dict.items():
        tmp = [(x, x) for x in value]
        object_dict[key] = tmp

    return object_dict
