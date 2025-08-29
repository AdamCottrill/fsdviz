"""
This file contains custom template tags used by the fsdviz
application.

"""

import calendar
import re

from django import template
from django.core.paginator import Paginator

register = template.Library()


@register.filter(name="filter_colour")
def filter_colour(x):
    """returns a colour used to fill-in buttons associated with specific
    filters - ensures consistency across views and templates.

    """

    button_colours = {
        "agency": "red",
        "lake": "blue",
        "year": "teal",
        "first_year": "green",
        "last_year": "olive",
        "contains": "pink",
        "species": "orange",
        "strain": "yellow",
        "lifestage": "violet",
        "stocking_method": "brown",
        # still have grey, black, and purple
    }

    return button_colours.get(x, "")


@register.filter(name="format_cwt")
def format_cwt(x):
    """
    format cwts as 63-03-99
    """

    x = str(x)
    cwt = "-".join([x[:2], x[2:4], x[4:6]])
    return cwt


@register.filter(name="times")
def times(number):
    """provides a range() like template filter to iterate over integer
    values.

    from :https://stackoverflow.com/questions/1107737

    """

    return range(1, number + 1)


@register.simple_tag(takes_context=True)
def query_transform(context, include_page=False, **kwargs):
    """
    Returns the URL-encoded querystring for the current page,
    updating the params with the key/value pairs passed to the tag.

    E.g: given the querystring ?foo=1&bar=2
    {% query_transform bar=3 %} outputs ?foo=1&bar=3
    {% query_transform foo='baz' %} outputs ?foo=baz&bar=2
    {% query_transform foo='one' bar='two' baz=99 %}
    outputs ?foo=one&bar=two&baz=99

    A RequestContext is required for access to the current querystring.

    from: https://gist.github.com/benbacardi/d6cd0fb8c85e1547c3c60f95f5b2d5e1

    if page is true, we will return the page number tag too, if it is
    false, we want to strip it out and reset our filters to page 1.
    This allows the same template tag to be used in paginators and
    'refinement' widgets.  Without, refinement widgets may point to a
    page that doesn't exist after the new filter has been applied.

    """

    query = context["request"].GET.copy()
    for k, v in kwargs.items():
        query[k] = v

    if query.get("page") and not include_page:
        query.pop("page")
    return query.urlencode()


@register.simple_tag(takes_context=True)
def strip_parameter(context, param):
    """
    A template tag to remove the specified parameter from the url
    string.  If there are no parameter left, it returns the bare
    url (without any parameters or ?-mark)
    """

    query = context["request"].GET.copy()
    query.pop(param)

    if len(query):
        return "?" + query.urlencode()
    else:
        return context["request"].path


@register.simple_tag(takes_context=True)
def next_year(context, year):
    """Used to incrcrement urls that contain year with the value for the
    next year.  Parameters that are pass in are preserved and passed
    through to the destination url.  This tag is used in the event
    list templates.

    /stocking/events/HU/2008/?species=LAT

    becomes:

    /stocking/events/HU/2009/?species=LAT

    """

    query = context["request"].GET.copy()

    # conert to strings with leading slash
    this_year = "/{}".format(year)
    next_year = "/{}".format(year + 1)
    mypath = context["request"].path.replace(this_year, next_year)
    if query:
        mypath += "?" + query.urlencode()
    return mypath


@register.simple_tag(takes_context=True)
def last_year(context, year):
    """Used to increment urls that contain year with the previous year
    value. Parameters that are pass in are preserved and passed
    through to the destination url.  This tag is used in the event
    list templates.

    /stocking/events/HU/2008/?species=LAT

    becomes:

    /stocking/events/HU/2007/?species=LAT

    """

    query = context["request"].GET.copy()

    # conert to strings with leading slash
    this_year = "/{}".format(year)
    last_year = "/{}".format(year - 1)
    mypath = context["request"].path.replace(this_year, last_year)

    if query:
        mypath += "?" + query.urlencode()
    return mypath


@register.filter
def humanize_error_label(label, zero_index=True):
    """A helper function used to convert server errors returned from
    formset validation into human readable label

    converts: 'id_form-10-__all__' to 'Row 11'

    """

    regex = re.compile(r"id_form-(\d{1,3})")
    match = regex.search(label)
    if match:
        value = int(match.group(1))
        if zero_index:
            value = value + 1
        return f"Row {value}"
    else:
        return lable


@register.filter
def month_name(month_number):
    """Given a number return the associated month name (e.g month_name(1)
    returns "January")

    from: https://stackoverflow.com/questions/7385751/

    """
    if month_number is None:
        return None
    else:
        return calendar.month_name[month_number]


def get_elided_page_range(paginator, number=1, *, on_each_side=3, on_ends=2):
    """Return a 1-based range of pages with some values elided.

    If the page range is larger than a given size, the whole range is not
    provided and a compact form is returned instead, e.g. for a paginator
    with 50 pages, if page 43 were the current page, the output, with the
    default arguments, would be:

        1, 2,  , 40, 41, 42, 43, 44, 45, 46,  , 49, 50.

    COPIED FROM DJANGO==3.2 source code.  This will no longer be
    necessary when we upgrade to 3.2 or greater.

    """
    number = paginator.validate_number(number)

    ELLIPSIS = "..."

    if paginator.num_pages <= (on_each_side + on_ends) * 2:
        yield from paginator.page_range
        return

    if number > (1 + on_each_side + on_ends) + 1:
        yield from range(1, on_ends + 1)
        yield ELLIPSIS
        yield from range(number - on_each_side, number + 1)
    else:
        yield from range(1, number + 1)

    if number < (paginator.num_pages - on_each_side - on_ends) - 1:
        yield from range(number + 1, number + on_each_side + 1)
        yield ELLIPSIS
        yield from range(paginator.num_pages - on_ends + 1, paginator.num_pages + 1)
    else:
        yield from range(number + 1, paginator.num_pages + 1)


@register.simple_tag
def get_adjusted_elided_page_range(p, number, on_each_side=2, on_ends=2):
    paginator = Paginator(p.object_list, p.per_page)
    # DJANGO >=3.2:
    # return paginator.get_elided_page_range(
    #    number=number, on_each_side=on_each_side, on_ends=on_ends
    # )
    return get_elided_page_range(
        paginator, number=number, on_each_side=on_each_side, on_ends=on_ends
    )
