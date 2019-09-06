"""
=============================================================
~/fsdviz/fsdviz/common/utils.py
 Created: 06 Sep 2019 11:38:22

 DESCRIPTION:

  Some utility functions that are used in the fsdviz application.

 A. Cottrill
=============================================================
"""


def to_lake_dict(object_list, has_id=False):
    """A little helper function that takes a list of objects and returns a
    dictionary of lists. The first element of each list is used to
    create the key for the dictionary, the element second is added to
    the list for that key value.  Used to create lake specific list of
    stat_districts and grids.

    object_list = [['ER', ('er_1003', '1003')],
                   ['ER', ('er_1004', '1004')],
                   ['ER', ('er_1005', '1005')]]

    Returns: {"ER": [
    ('er_1003', '1003'),
    ('er_1004', '1004'),
    ('er_1005', '1005')
    ], "HU":[...]
    }

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

    if has_id is False:
        # convert our flat lists into lists of two element tuples repeating
        # the first element
        for key, value in object_dict.items():
            tmp = [(x, x) for x in value]
            object_dict[key] = tmp

    return object_dict


def make_mu_id_lookup(mus):
    """a function that lakes of list of management unit objects and
returns a dictionary of dictionaryies that are keyed first by lake ,
and then by management unit label.

This:
(12, 'hu_mu_mh3', 'HU', 'MH3')
(13, 'hu_mu_mh4', 'HU', 'MH4')
(14, 'hu_mu_mh5', 'HU', 'MH5')
(15, 'hu_mu_mh6', 'HU', 'MH6')
(16, 'er_mu_mich', 'ER', 'MICH')
(38, 'er_mu_ny', 'ER', 'NY')
(39, 'er_mu_o1', 'ER', 'O1')
(40, 'er_mu_o2', 'ER', 'O2')
(41, 'er_mu_o3', 'ER', 'O3')

becomes this:
{"HU": {"MH3":12,"MH4": 13,...}, "ER": {"NY":16}, ...}

    """
    mu_lookup = {}
    for mu in mus:
        lake_abbrev = mu[2]
        items = mu_lookup.get(lake_abbrev)
        if items:
            # label:id
            items[mu[3]] = mu[0]
        else:
            items = {mu[3]: mu[0]}
        mu_lookup[lake_abbrev] = items
    return mu_lookup


def toLookup(object_list):
    """A helper function that take a list of two element objects and
    returns a dictionary that uses the second element as the key. The
    returned dictionary can be used find the id of an object based on the
    key passed in. Reduces the number of database queries to one.

    the items in the object list should be of the format:
    ("id","value"). the returned dictionary can then be used as
    foo['value'] to quickly return the associated id.

    """
    return {x[1]: x[0] for x in object_list}


def toChoices(object_list):
    """A function to format a list of objects to a list of two-element
    tuples expected by django select widgets.  Of the form ('value','display')"""
    if len(object_list[0]) == 2:
        return [(x[1], x[1]) for x in object_list]
    else:
        return [(x[1], x[2]) for x in object_list]


def make_strain_id_lookup(object_list):
    """a function that lakes of list of strain objects and returns a
    dictionary of dictionaries that are keyed first by species, and
    then raw strain value.

    This:

    [(45, 'ATS', 'TUND'),
    (278, 'ATS', 'UNKN'),
    (46, 'ATS', 'WR-W'),
    (283, 'BKT', ''),
    (47, 'BKT', '*')....]

    becomes this:
    {"ATS": {"TUND":45,"UNKN": 278,...}, "BKT": {"":283, "*": 47}, ...}

    """
    lookup = {}
    for mu in object_list:
        top_key = mu[1]
        items = lookup.get(top_key)
        if items:
            # label:id
            items[mu[2]] = mu[0]
        else:
            items = {mu[2]: mu[0]}
        lookup[top_key] = items
    return lookup
