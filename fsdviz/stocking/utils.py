"""
=============================================================
~/fsdviz/fsdviz/stocking/utils.py
 Created: 28 Aug 2019 14:02:01

 DESCRIPTION:

   Utility functions used by the fsdviz stocking application

 A. Cottrill
=============================================================
"""

from openpyxl import load_workbook


from ..common.models import Lake, Species, StateProvince, ManagementUnit, Agency, Grid10
from .models import StockingMethod, LifeStage, Condition

from ..common.utils import to_lake_dict


def get_events(data_file):
    """A helper function to read our excel file and return a list of
    dictionaries for each row in the spreadsheet.  The keys of the
    dictionaries are determined by the first row in the spreadsheet.

    """

    wb = load_workbook(filename=data_file.open(), data_only=True)
    ws = wb.worksheets[0]

    data = []

    for i, row in enumerate(ws.rows):
        if i == 0:
            keys = [x.value for x in row]
        else:
            vals = [x.value for x in row]
            tmp = {k: v for k, v in zip(keys, vals)}
            data.append(tmp)
    return data


def get_xls_form_choices():
    """A helper function used by xls_events_form for provide a list of
    dictionaries that are use to populate the choice fields in the
    stocking event form.
    """

    # stat_dist and grids will be added to dictionaries that are keyed by lake:
    stat_dist = (
        ManagementUnit.objects.select_related("lake")
        .filter(primary=True)
        .values_list("lake__abbrev", "label")
    )
    stat_dist_dict = to_lake_dict(stat_dist)

    grids = Grid10.objects.select_related("lake").values_list("lake__abbrev", "grid")
    grid_dict = to_lake_dict(grids)

    choices = {
        "lakes": [(x, x) for x in Lake.objects.values_list("abbrev", flat=True)],
        "agencies": [(x, x) for x in Agency.objects.values_list("abbrev", flat=True)],
        "state_prov": [
            (x, x) for x in StateProvince.objects.values_list("abbrev", flat=True)
        ],
        "stat_dist": stat_dist_dict,
        "species": [x for x in Species.objects.values_list("abbrev", "common_name")],
        "lifestage": [
            x for x in LifeStage.objects.values_list("abbrev", "description")
        ],
        "condition": [
            (x, x) for x in Condition.objects.values_list("condition", flat=True)
        ],
        "stocking_method": [
            x for x in StockingMethod.objects.values_list("stk_meth", "description")
        ],
        "grids": grid_dict,
    }

    return choices


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
