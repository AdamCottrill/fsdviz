"""
Tests for the models in the common application - agency, lake,
species, ect.

"""

import pytest

from .factories import (LakeFactory, AgencyFactory, StateProvinceFactory,
                        ManagementUnitFactory, Grid10Factory, SpeciesFactory,
                        StrainFactory, StrainRawFactory)

@pytest.mark.django_db
def test_lake_str():
    """
    Verify that the string representation of a Lake object is the lake
    name followed by the lake abbreviation in brackets.
    """

    obj = LakeFactory(lake_name='Huron', abbrev='HU')
    assert str(obj) == "Huron (HU)"



@pytest.mark.django_db
def test_agency_str():
    """
    Verify that the string representation of an Agency object is the agency
    name followed by the agency abbreviation in brackets.
    """

    agency_name = 'Ontario Ministry of Natural Resources'
    obj = AgencyFactory(agency_name=agency_name,
                        abbrev='OMNR')
    assert str(obj) == 'Ontario Ministry of Natural Resources (OMNR)'


@pytest.mark.django_db
def test_state_province_str():
    """
    Verify that the string representation of a stateProvience object
    is the StateProvince name followed by the abbreviation in
    brackets.

    """

    full_name = 'Ontario'
    obj = StateProvinceFactory(name=full_name,
                               abbrev='ON')
    assert str(obj) == 'Ontario (ON)'


@pytest.mark.django_db
def test_management_unit_str():
    """
    Verify that the string representation of a management unit object
    is the lake, followed by the management unit type, follwed by the label.

    """

    mu_type = 'MU'
    label = 'A Management Unit'

    lake = LakeFactory(lake_name='Huron', abbrev='HU')
    management_unit = ManagementUnitFactory(label=label,
                                            mu_type=mu_type,
                                            lake=lake)
    shouldbe = '{} {} {}'.format(str(lake), mu_type.upper(), label)
    assert str(management_unit) == shouldbe


@pytest.mark.django_db
def test_grid10_str():
    """
    Verify that the string representation of a grid10 object
    is the grid number, followed by the lake abbreviation in brackets.
    """

    lake_abbrev = 'HU'
    grid_number = '1234'
    lake = LakeFactory(lake_name='Huron', abbrev=lake_abbrev)
    grid10 = Grid10Factory(grid=grid_number, lake=lake)
    shouldbe = '{} ({})'.format(grid_number, lake_abbrev)
    assert str(grid10) == shouldbe


@pytest.mark.django_db
def test_species_str():
    """
    Verify that the string representation of a species object
    is the species name followed by the species abbreviation in brackets.

    'Walleye (WAE)'

    """

    abbrev = 'WAE'
    common_name = 'Walleye'
    species = SpeciesFactory(common_name=common_name, abbrev=abbrev)
    shouldbe = '{} ({})'.format(common_name, abbrev)
    assert str(species) == shouldbe



@pytest.mark.django_db
def test_strain_str():
    """
    Verify that the string representation of a strain object is the
    strain name, followed by the species name followed by the strain
    code in brackets.

    'Seneca Strain Lake Trout (SEN)'

    """


    strain_code = 'SEN'
    strain_label = 'Seneca'

    species_abbrev = 'LAT'
    common_name = 'Lake Trout'

    species = SpeciesFactory(common_name=common_name,
                             abbrev=species_abbrev)
    strain = StrainFactory(strain_code=strain_code,
                           strain_label=strain_label,
                           strain_species=species)

    shouldbe = '{} Strain {} ({})'.format(strain_label, common_name,
                                          strain_code)
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
        strain=strain, species=species,
        raw_strain=strain_code,
        description=description
    )


    shouldbe = '{} ({})'.format(description, strain_code)
    assert str(rawstrain) == shouldbe
