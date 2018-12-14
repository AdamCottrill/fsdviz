'''
=============================================================
~/fsdviz/utils/common_lookups.py
Created: 12 Dec 2018 11:26:34

DESCRIPTION:

Lookup tables used to populate the common tables.

A. Cottrill
=============================================================
'''


#CWT - this might be better as choice field:
TAG_MANUFACTURER = [
    ('MM', 'Micro Mark'),
    ('NMT','Northwest Marine Technologies'),]


#STOCKING
STOCKING_METHOD = [
    ('a', 'airplane'),
    ('b', 'boat, offshore stocking'),
    ('bp', 'backpack'),
    ('i', 'inshore stocking, up tributaries'),
    ('incub', 'instream incubation'),
    ('t', 'truck, onshore or nearshore stocking'),
    ('u', 'unknown'),
    ('o', 'other'),
    ('s', 'snowmobile'),
    ('atv', 'all terrain vehicle'),
]

LIFESTAGE = [
    ('a', 'age-2 or older'),
    ('e', 'egg'),
    ('f', 'fingerling, age-0'),
    ('ff', 'fall fingerling, age-0'),
    ('fry', 'fry, age-0'),
    ('sf', 'spring fingerling, age-0'),
    ('suf', 'summer fingerling, age-0'),
    ('y', 'yearling, age-1'),
]

CONDITION = [
    (0, 'unknown condition at stocking'),
    (1, '<1% mortality observed, "excellent"'),
    (2, '1-2% mortality observed, "good"'),
    (3, '3-5% mortality observed, "fair"'),
    (4, '5-25% mortality observed, "bad," explain in Notes field'),
    (5, '>25% mortality observed, "very bad," explain in Notes field'),
    (6, 'mortality is accounted in reported total stocked'),
    (7, 'distressed or sick, unknown mortality'),
]



#TODO check for cwt marks without cwt number!
MARKS = [
    # mark_code, clip_code, description, mark_type
         ('XX', '', 'No Data', None),
         ('NO', '0', 'No Clip', 'finclip'),
         ('RP', '1', 'Right Pectoral Fin Clip', 'finclip'),
         ('LP', '2', 'Left Pectoral Fin Clip', 'finclip'),
         ('RV', '3', 'Right Ventral Fin Clip', 'finclip'),
         ('LV', '4', 'Left Ventral Fin Clip', 'finclip'),
         ('RM', 'E', 'Right Maxilla Fin Clip', 'finclip'),
         ('LM', 'F', 'Left Maxilla Fin Clip', 'finclip'),
         ('AD', '5', 'Adipose Fin Clip', 'finclip'),
         ('DO', '7', 'Anterior Dorsal Fin Clip', 'finclip'),
         ('CWT', 'C', 'Coded Wire Tag', 'tag'),
         ('PT', 'P', 'PIT (Passive Integrated Transponder) Tag', 'tag'),
         ('OX', 'X', 'Oxytetracyclene', 'chemical'),
         ('FT', 'T', 'Floy Tag', 'tag'),
]


MARK_SHOULDBE = {
    'NONE':'NO',
    'BP':'LPRP',
    'BV':'LVRV',
    'FTG':'FT',
    'PIT':'PT',
    'OXOX':'OX',
    'ADOX':'OXAD'
}

CLIP2MARK = {
    #ontario clip codes to US MARKS:
    '0': 'NO',
    '1': 'RP',
    '2': 'LP',
    '3': 'RV',
    '4': 'LV',
    '5': 'AD',
    '7': 'DO',
    'E': 'RM',
    'F': 'LM'
}
