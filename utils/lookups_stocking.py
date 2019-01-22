'''
=============================================================
~/fsdviz/utils/common_lookups.py
Created: 12 Dec 2018 11:26:34

DESCRIPTION:

Lookup tables used to populate the stocking tables.

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
