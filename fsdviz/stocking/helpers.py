"""
=============================================================
~/fsdviz/fsdviz/stocking/helpers.py
 Created: 28 Aug 2019 14:02:01


 DESCRIPTION:



 A. Cottrill
=============================================================
"""

from openpyxl import load_workbook


def get_events(data_file):
    """A helper function to read our excel file and return a list of dictionaries
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
