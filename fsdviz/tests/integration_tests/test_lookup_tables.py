import pytest
from django.urls import reverse
from pytest_django.asserts import assertTemplateUsed, assertContains, assertNotContains

from fsdviz.common.models import LookupDescription


# the lookup table page has blocks to display lookup table
# descriptions as presented in the admin table, if no description is
# provided, an error message should be presented to that effect.


lookup_tables = [
        {
            "model_name": "Agencies",
            "slug": "agencies",
            "description": "the agency lookup table",
            "missing_message": 'Sorry. A description of the "Agencies" table has not been provided.',
        },
        {
            "model_name": "Fin Clips",
            "slug": "fin_clips",
            "description": "The fin clip lookup table",
            "missing_message": 'Sorry. A description of the "Fin Clips" table has not been provided.',
        },
        {
            "model_name": "Fish Tags",
            "slug": "fish_tags",
            "description": "the fish tag lookup table",
            "missing_message": 'Sorry. A description of the "Fish Tags" table has not been provided.',
        },
        {
            "model_name": "Hatcheries",
            "slug": "hatcheries",
            "description": "the hatchery lookup table",
            "missing_message": 'Sorry. A description of the "Hatcheries" table has not been provided.',
        },
        {
            "model_name": "Jurisdictions",
            "slug": "jurisdictions",
            "description": "The jurisdiction lookup table",
            "missing_message": 'Sorry. A description of the "Jurisdictions" table has not been provided.',
        },
        {
            "model_name": "Lakes",
            "slug": "lakes",
            "description": "the lakes lookup table",
            "missing_message": 'Sorry. A description of the "Lakes" table has not been provided.',
        },
        {
            "model_name": "Lifestages",
            "slug": "lifestages",
            "description": "The life stage lookup table",
            "missing_message": 'Sorry. A description of the "Lifestages" table has not been provided.',
        },
        {
            "model_name": "Physical or Chemical Marks",
            "slug": "physical_or_chemical_marks",
            "description": "Physical or Chemical Marks",
            "missing_message": 'Sorry. A description of the "Physical or Chemical Marks" table has not been provided.',
        },
        {
            "model_name": "Species",
            "slug": "species",
            "description": "the Species lookup table",
            "missing_message": 'Sorry. A description of the "Species" table has not been provided.',
        },
        {
            "model_name": "Stocking Methods",
            "slug": "stocking_methods",
            "description": "the stocking methods lookup table",
            "missing_message": 'Sorry. A description of the "Stocking Methods" table has not been provided.',
        },
        {
            "model_name": "Strains",
            "slug": "strains",
            "description": "The strains lookup table",
            "missing_message": 'Sorry. A description of the "Strains" table has not been provided.',
        },
    ]




# populated the database with out lookup table descriptions
@pytest.fixture
def setup():

    for item in lookup_tables:
        lookup = LookupDescription(model_name=item['model_name'],
                                   slug=item['slug'],
                                   description=item['description']
                                   )
        lookup.save()


# render the page and verify that the description in each element is
# in the response.


@pytest.mark.django_db
def test_lookup_descriptions_render(client, setup):

    url = reverse("common:lookup-tables")
    response = client.get(url)

    for table in lookup_tables:
        expected = table["description"]
        assertContains(response, expected)


# loop over the elements in table descriptions, delete the current
# model and render the page. The missng message should be inlcuded in
# the response.


@pytest.mark.django_db
@pytest.mark.parametrize("lookup", lookup_tables)
def test_lookup_description_missing_message(client, setup, lookup):

    # delete the current lookup table
    LookupDescription.objects.get(slug=lookup['slug']).delete()

    url = reverse("common:lookup-tables")
    response = client.get(url)

    assertTemplateUsed(response, "common/lookup_tables.html")
    assert response.status_code==200

    fname = "c:/Users/COTTRILLAD/Documents/1work/scrapbook/wtf.html"
    with open(fname, "wb") as f:
        f.write(response.content)

    expected = lookup["missing_message"]
    assertContains(response, expected)
