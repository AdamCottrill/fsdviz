"""
This file contains custom template tags used by the fsdviz
application.

"""

from django import template

register = template.Library()


@register.filter(name='format_cwt')
def format_cwt(x):
    '''
    format cwts as 63-03-99
    '''
    x = str(x)
    cwt = "-".join([x[:2], x[2:4], x[4:6]])
    return cwt


@register.filter(name='times')
def times(number):
    '''provides a range() like template filter to iterate over integer
    values.

    from :https://stackoverflow.com/questions/1107737

    '''

    return range(1, number+1)

@register.simple_tag(takes_context=True)
def query_transform(context, include_page=False, **kwargs):
    '''
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

    '''

    query = context['request'].GET.copy()
    for k, v in kwargs.items():
            query[k] = v

    if query.get('page') and not include_page:
        query.pop('page')
    return query.urlencode()


@register.simple_tag(takes_context=True)
def strip_parameter(context, param):
    '''
    A template tag to remove the specified parameter from the url
    string.  If there are no parameter left, it returns the bare
    url (without any parameters or ?-mark)
    '''

    query = context['request'].GET.copy()
    query.pop(param)

    if len(query):
        return '?' + query.urlencode()
    else:
        return context['request'].path


@register.simple_tag(takes_context=True)
def next_year(context, year):
    '''Used to incrcrement urls that contain year with the value for the
    next year.  Parameters that are pass in are preserved and passed
    through to the destination url.  This tag is used in the event
    list templates.

    /stocking/events/HU/2008/?species=LAT

    becomes:

    /stocking/events/HU/2009/?species=LAT

    '''

    query = context['request'].GET.copy()

    # conert to strings with leading slash
    this_year = '/{}'.format(year)
    next_year = '/{}'.format(year + 1)
    mypath = context['request'].path.replace(this_year, next_year)
    if query:
        mypath += '?' + query.urlencode()
    return mypath


@register.simple_tag(takes_context=True)
def last_year(context, year):
    '''Used to increment urls that contain year with the previous year
    value. Parameters that are pass in are preserved and passed
    through to the destination url.  This tag is used in the event
    list templates.

    /stocking/events/HU/2008/?species=LAT

    becomes:

    /stocking/events/HU/2007/?species=LAT

    '''

    query = context['request'].GET.copy()

    # conert to strings with leading slash
    this_year = '/{}'.format(year)
    last_year = '/{}'.format(year - 1)
    mypath = context['request'].path.replace(this_year, last_year)

    if query:
        mypath += '?' + query.urlencode()
    return mypath
