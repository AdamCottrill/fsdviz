from django import forms
from django.contrib.gis.geos import GEOSGeometry
from django.core.validators import FileExtensionValidator
from django.utils.html import format_html


def fill_color_widget(color):
    """Return an html div formatted as a rectangle, filled with the
    specifed color. Used to display the fill colour on the django
    admin list views.

    """
    html = format_html(
        """<div id="rectangle"
            style="width:20px;
            height:20px;
            border-style:solid;
            border-width:1px;
            border-color:#808080;
            background-color:{0}"></div>""",
        color,
    )
    return html


def geom_file_field():
    allowed_extensions = ["geojson", "json", "wkt"]
    geom_file = forms.FileField(
        help_text="Geojson or WKT representation of this geometry",
        required=False,
        validators=[
            FileExtensionValidator(
                allowed_extensions,
                f"""File extentions must be one of {', '.join(
                [f"*.{x}" for x in allowed_extensions]
                )}.""",
            ),
        ],
        widget=forms.FileInput(
            attrs={"accept": ",".join([f".{x}" for x in allowed_extensions])}
        ),
    )
    return geom_file


def geom_from_json(input_string):
    """Convert the input string to json and pull our the geometry of
    the *first* feature.  the return variable will be a json string
    representing the geometry or None.

    Arguments: -

    `input_string`: a string created from the contents of
    an uploaded geojson or wkt file.

    """

    try:
        geojson = json.loads(input_string)
    except ValueError:
        return None
    if "features" in geojson:
        geometry = geojson["features"][0]["geometry"]
        return geometry
    else:
        return None


def geom_from_file(geom_file):
    """A function that takes a file-like object (inmemory uploaded
    file) and tries to create a GEOSGeometry object from it.  If the
    contents can converted directly to a geometry that is returned,
    otherwise it tries to convert the object to geojson and extract
    the geometry from the *FIRST* feature.  Multiple features are not
    supported and are not consisten with how geometries are currently
    used in our models.

    Arguments:
    - `geom_file`:

    """
    geom = None

    file_contents = geom_file.read().decode().strip()
    geometry = geom_from_json(file_contents)

    if geometry is None:
        try:
            geom = GEOSGeometry(file_contents)
        except ValueError:  # or GDALException
            pass
    else:
        try:
            geom = GEOSGeometry(json.dumps(geometry))
        except ValueError:
            pass
    return geom
