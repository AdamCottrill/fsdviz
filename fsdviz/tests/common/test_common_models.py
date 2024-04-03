"""
Tests for the models in the common application - agency, lake,
species, ect.

"""

import pytest
from django.core.exceptions import ValidationError

from ...common.models import CWTsequence
from ..factories.common_factories import (
    AgencyFactory,
    CompositeFinClipFactory,
    CWTFactory,
    CWTsequenceFactory,
    FinClipFactory,
    FishTagFactory,
    Grid10Factory,
    JurisdictionFactory,
    LakeFactory,
    LatLonFlagFactory,
    ManagementUnitFactory,
    MarkFactory,
    PhysChemMarkFactory,
    SpeciesFactory,
    StateProvinceFactory,
    StrainFactory,
    StrainRawFactory,
)


@pytest.mark.django_db
def test_lake_str():
    """
    Verify that the string representation of a Lake object is the lake
    name followed by the lake abbreviation in brackets.
    """

    obj = LakeFactory(lake_name="Huron", abbrev="HU")
    assert str(obj) == "Huron (HU)"


@pytest.mark.django_db
def test_lake_short_name():
    """Verify that the short_name method of our lake model returns just
    the lake name withouth the 'Lake '

    """

    lake = LakeFactory(lake_name="Lake Huron", abbrev="HU")
    assert lake.short_name() == "Huron"


invalid_bounds = [
    (
        {
            "max_lat": 43.0,
            "min_lat": 45.0,
            "max_lon": -81.0,
            "min_lon": -83.0,
        },
        "Maximum Latitude must be greater than minimum Latitude.",
    ),
    (
        {
            "max_lat": 45.0,
            "min_lat": 43.0,
            "max_lon": -83.0,
            "min_lon": -81.0,
        },
        "Maximum Longitude must be greater than minimum Longitude.",
    ),
]


@pytest.mark.parametrize("args, errmsg", invalid_bounds)
@pytest.mark.django_db
def test_lake_bounds(args, errmsg):
    """Verify that the clean method raises an excpetion if we pass in
    bounds that are switched.

    """
    with pytest.raises(ValidationError) as excinfo:
        lake = LakeFactory(lake_name="Lake Huron", abbrev="HU", **args)
        lake.save()
    assert errmsg in str(excinfo.value)


@pytest.mark.django_db
def test_lake_coordinate_limits():
    """Verify that the coordinate limits method on the Lake model
    returns the correct values in the correct order.

    """

    min_lat = 42.1
    max_lat = 45.2
    min_lon = -79.2
    max_lon = -77.6
    expected = [min_lon, min_lat, max_lon, max_lat]

    lake = LakeFactory(
        lake_name="Lake Huron",
        abbrev="HU",
        min_lat=min_lat,
        max_lat=max_lat,
        min_lon=min_lon,
        max_lon=max_lon,
    )

    assert lake.coordinate_limits() == expected


@pytest.mark.django_db
def test_agency_str():
    """
    Verify that the string representation of an Agency object is the agency
    name followed by the agency abbreviation in brackets.
    """

    agency_name = "Ontario Ministry of Natural Resources"
    obj = AgencyFactory(agency_name=agency_name, abbrev="OMNR")
    assert str(obj) == "Ontario Ministry of Natural Resources (OMNR)"


@pytest.mark.django_db
def test_state_province_str():
    """
    Verify that the string representation of a stateProvience object
    is the StateProvince name followed by the abbreviation in
    brackets.

    """

    full_name = "Ontario"
    obj = StateProvinceFactory(name=full_name, abbrev="ON")
    assert str(obj) == "Ontario (ON)"


@pytest.mark.django_db
def test_jurisdiction_str():
    """
    Verify that the string representation of a jurisdiction object
    is the lake name followed by the state/Province name

    """

    full_name = "Ontario"
    stateprov = StateProvinceFactory(name=full_name, abbrev="ON")
    lake_name = "Lake Huron"
    lake = LakeFactory(lake_name=lake_name)

    obj = JurisdictionFactory(stateprov=stateprov, lake=lake)

    shouldbe = "{} - {} waters".format(lake_name, full_name)
    assert str(obj) == shouldbe


@pytest.mark.django_db
def test_management_unit_str():
    """
    Verify that the string representation of a management unit object
    is the lake, followed by the management unit type, follwed by the label.

    """

    mu_type = "MU"
    label = "A Management Unit"

    lake = LakeFactory(lake_name="Huron", abbrev="HU")
    management_unit = ManagementUnitFactory(label=label, mu_type=mu_type, lake=lake)
    shouldbe = "{} {} {}".format(str(lake), mu_type.upper(), label)
    assert str(management_unit) == shouldbe


@pytest.mark.django_db
def test_grid10_str():
    """
    Verify that the string representation of a grid10 object
    is the grid number, followed by the lake abbreviation in brackets.
    """

    lake_abbrev = "HU"
    grid_number = "1234"
    lake = LakeFactory(lake_name="Huron", abbrev=lake_abbrev)
    grid10 = Grid10Factory(grid=grid_number, lake=lake)
    shouldbe = "{} ({})".format(grid_number, lake_abbrev)
    assert str(grid10) == shouldbe


@pytest.mark.django_db
def test_species_str():
    """
    Verify that the string representation of a species object
    is the species name followed by the species abbreviation in brackets.

    'Walleye (WAE)'

    """

    abbrev = "WAE"
    common_name = "Walleye"
    species = SpeciesFactory(common_name=common_name, abbrev=abbrev)
    shouldbe = "{} ({})".format(common_name, abbrev)
    assert str(species) == shouldbe


@pytest.mark.django_db
def test_strain_str():
    """
    Verify that the string representation of a strain object is the
    strain name, followed by the species name followed by the strain
    code in brackets.

    'Seneca Strain Lake Trout (SEN)'

    """

    strain_code = "SEN"
    strain_label = "Seneca"

    species_abbrev = "LAT"
    common_name = "Lake Trout"

    species = SpeciesFactory(common_name=common_name, abbrev=species_abbrev)
    strain = StrainFactory(
        strain_code=strain_code, strain_label=strain_label, strain_species=species
    )

    shouldbe = "{} Strain {} ({})".format(strain_label, common_name, strain_code)
    assert str(strain) == shouldbe


@pytest.mark.django_db
def test_strainraw_str():
    """
    Verify that the string representation of a raw object
    is the strain code followed by the description in brackets.

    'My Special Strain (MSS)'

    """
    strain_code = "MSS"
    description = "My Special Strain"

    species = SpeciesFactory()
    strain = StrainFactory(strain_species=species)

    rawstrain = StrainRawFactory(
        strain=strain, species=species, raw_strain=strain_code, description=description
    )

    shouldbe = "{} ({})".format(description, strain_code)
    assert str(rawstrain) == shouldbe


@pytest.mark.django_db
def test_strainraw_clean():
    """The strainraw model has a clean method that ensures that the
    species associated with strain matches the species of the current
    raw strain.

    """
    strain_code = "MSS"
    description = "My Conflicted Strain"

    lat = SpeciesFactory(abbrev="LAT", common_name="Lake Trout")
    lat_strain = StrainFactory(strain_species=lat)

    walleye = SpeciesFactory(abbrev="WAL", common_name="Walleye")

    with pytest.raises(ValidationError) as excinfo:
        rawstrain = StrainRawFactory(
            strain=lat_strain,
            species=walleye,
            raw_strain=strain_code,
            description=description,
        )

    msg = "Selected Strain is not consistent with selected Species."
    assert msg in str(excinfo.value)


@pytest.mark.django_db
def test_mark_str():
    """
    Verify that the string representation of a mark object
    is the description followed by the mark_code in parenthesis.

    'Adipose Clip (AD)'

    """

    mark_code = "AD"
    description = "Adipose Fin"

    mark = MarkFactory(mark_code=mark_code, description=description)

    shouldbe = "{} ({})".format(description, mark_code)
    assert str(mark) == shouldbe


@pytest.mark.django_db
def test_latlonflag_str():
    """
    Verify that the string representation of a latlonflag object
    is the code followed by the description.

    '1 - Reported'

    """

    value = "1"
    description = "reported"

    latlonflag = LatLonFlagFactory(value=value, description=description)

    shouldbe = "{} - {}".format(value, description)
    assert str(latlonflag) == shouldbe


@pytest.mark.django_db
def test_cwt_str():
    """Verify that the string representation of a cwt object is the cwt
    number formatted with dashes followed by the manufacturer and
    tag_type abbreviation in parentheses.

    '12-34-56 (nmt-cwt)'

    """

    cwt_number = "123456"
    maker = "nmt"
    tag_type = "cwt"
    cwt = CWTFactory(cwt_number=cwt_number, manufacturer=maker, tag_type=tag_type)
    shouldbe = "{}-{}-{} ({} {})".format(
        cwt_number[:2], cwt_number[2:4], cwt_number[4:], maker, tag_type
    )
    assert str(cwt) == shouldbe


@pytest.mark.django_db
def test_cwt_slug():
    """Verify that the slug of cwt object is the cwt
    number followed by the manufacturer and tag_type abbreviation .

    '123456_nmt_cwt'

    """

    cwt_number = "123456"
    maker = "nmt"
    tag_type = "cwt"
    cwt = CWTFactory(cwt_number=cwt_number, manufacturer=maker, tag_type=tag_type)

    shouldbe = "{}_{}_{}".format(cwt_number, maker, tag_type)
    assert cwt.slug == shouldbe


@pytest.mark.django_db
def test_cwt_sequence_str():
    """
    Verify that the string representation of a seq object is the cwt number,
    followed by the seqence start and end in square brackets.

    '12-34-56 [1-5555]'

    """

    cwt_number = "123456"
    maker = "nmt"
    tag_type = "cwt"
    seq_start = 1
    seq_end = 5555
    sequence = [seq_start, seq_end]

    cwt = CWTFactory(cwt_number=cwt_number)

    cwt_sequence = CWTsequenceFactory(cwt=cwt, sequence=sequence)

    shouldbe = "{}-{}-{} ({} {}) [{}-{}]".format(
        cwt_number[:2],
        cwt_number[2:4],
        cwt_number[4:],
        maker,
        tag_type,
        seq_start,
        seq_end,
    )

    assert str(cwt_sequence) == shouldbe


@pytest.mark.django_db
def test_cwt_sequence_overlapping_range():
    """If we try to save a cwt sequence that has a range that overlaps
    with an existing cwtSequence an error should be thrown and the
    object should not be saved.

    """
    cwt_number = "123456"
    cwt = CWTFactory(cwt_number=cwt_number)
    sequence1 = CWTsequenceFactory(cwt=cwt, sequence=[1, 100])

    # create a second range that overlaps the first
    sequence2 = CWTsequence(cwt=cwt, sequence=[50, 150])

    with pytest.raises(Exception) as execinfo:
        sequence2.save()
    errmsg = 'Sequence Range overlaps with "{}"'.format(str(sequence1))
    assert execinfo.value.args[0] == errmsg


invalid_ranges = [
    (
        [-10, 10],
        "Invalid Range. Values in range must be greater than or equal to zero.",
    ),
    ([20, 10], "Invalid Range. The lower limit is greater than the upper limit."),
]


@pytest.mark.parametrize("range, errmsg", invalid_ranges)
@pytest.mark.django_db
def test_cwt_sequence_invalid_range(range, errmsg):
    """If we try to save a cwt sequence that has an invalid range error
    should be thrown and the object should not be saved.

    """
    cwt_number = "123456"
    cwt = CWTFactory(cwt_number=cwt_number)

    sequence2 = CWTsequence(cwt=cwt, sequence=range)

    with pytest.raises(Exception) as execinfo:
        sequence2.save()

    assert execinfo.value.messages[0] == errmsg
    assert CWTsequence.objects.count() == 0


sequence_ranges = [
    (0, 1),
    (10, 100),
]


@pytest.mark.parametrize("lower, upper", sequence_ranges)
@pytest.mark.django_db
def test_cwt_sequence_seq_bounds_on_save(lower, upper):
    """The cwtsequence model has a save method that populates the
    seq_lower and seq_upper values - these fields were added to the
    model so that the range could be included in the serialized
    responses. They are not editable, but are updated when the seq object is updated.

    """
    cwt_number = "123456"
    cwt = CWTFactory(cwt_number=cwt_number, tag_type="sequential")

    cwtsequence = CWTsequence(cwt=cwt, sequence=(lower, upper))
    cwtsequence.save()

    assert cwtsequence.seq_lower == lower
    assert cwtsequence.seq_upper == upper


@pytest.mark.django_db
def test_physchemmark_str():
    """Verify that the string representation of a PhysChemMark object is
    the description followed by the mark_code in brackets.

    """

    mark_code = "OX"
    description = "oxytetracycline"

    obj = PhysChemMarkFactory(mark_code=mark_code, description=description)
    assert str(obj) == "{} ({})".format(description, mark_code)


@pytest.mark.django_db
def test_compositefinclip_str():
    """Verify that the string representation of a CompositeFinClip object is
    the description followed by the clip code in brackets.

    """

    clip_code = "ADDO"
    description = "Adipose, Dorsal Clip"

    obj = CompositeFinClipFactory(clip_code=clip_code, description=description)
    assert str(obj) == "{} ({})".format(description, clip_code)


@pytest.mark.django_db
def test_finclip_str():
    """Verify that the string representation of a FinClip object is
    the description followed by the abbreviation in brackets.

    """

    abbrev = "AD"
    description = "Adipose"

    obj = FinClipFactory(abbrev=abbrev, description=description)
    assert str(obj) == "{} ({})".format(description, abbrev)


@pytest.mark.django_db
def test_fishtag_str():
    """Verify that the string representation of a FishTag object is
    the description followed by the tag code in brackets.

    """

    tag_code = "FTO"
    description = "Floy Tag, Orange"

    obj = FishTagFactory(tag_code=tag_code, description=description)
    assert str(obj) == "{} ({})".format(description, tag_code)
