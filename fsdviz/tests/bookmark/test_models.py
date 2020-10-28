"""
=============================================================
~/bookmark_it/tests/test_models.py
 Created: 20 Aug 2020 11:33:18

 DESCRIPTION:


 A. Cottrill
=============================================================
"""


import pytest

from bookmark_it.models import Bookmark, BookmarkTag
from .factories import UserFactory, BookmarkFactory


@pytest.mark.django_db
def test_bookmark_str():
    """The string representation of a bookmark should be the bookmark
    title followed by the username of the bookmark's author in
    parentheses.

    """

    username = "simpsonho"
    email = "homer@simpsons.com"
    title = "Test Title"
    user = UserFactory(username=username, email=email)
    bookmark = BookmarkFactory(user=user, title=title)
    assert str(bookmark) == "{} ({})".format(title, email)


@pytest.mark.django_db
def test_bookmark_get_absolute_url():
    """Verify that the url for the detial view of a bookmark object is:
    /bookmark/<int:pk>/
    """

    bookmark = BookmarkFactory()
    assert bookmark.get_absolute_url() == "/bookmarks/bookmark/{}/".format(bookmark.id)


@pytest.mark.django_db
def test_bookmark_url_are_unique_to_users():
    """two users can create two bookmarks with the same url value. They
    will be different bookmark objects.

    """
    user1 = UserFactory(username="homer")
    user2 = UserFactory(username="bart")
    url = "http://www.google.com"
    bookmark1 = BookmarkFactory(user=user1, url=url)
    bookmark1.save()

    bookmark2 = BookmarkFactory(user=user2, url=url)
    bookmark2.save()

    assert bookmark1.url == bookmark2.url
    assert bookmark1.id != bookmark2.id


@pytest.mark.django_db
def test_bookmark_url_are_unique_to_users():
    """

    """
    user = UserFactory(username="homer", email="homer@simpsons.com")
    url = "http://www.google.com"
    bookmark1 = Bookmark(user=user, url=url, title="test", description="test")
    bookmark1.save()

    bookmark2 = Bookmark(user=user, url=url, title="test", description="test")

    with pytest.raises(Exception) as execinfo:
        bookmark2.save()

    print(execinfo.value)

    # assert execinfo.value == "IntegrityError"
    msg = 'duplicate key value violates unique constraint "unique_user_url"'
    assert msg in str(execinfo.value)


@pytest.mark.django_db
def test_user_can_have_just_one_homepage():
    """A user can create an unlimited number of bookmarks, but only one
    can be the homeage.

    """

    user = UserFactory()
    bookmark1 = BookmarkFactory(user=user, homepage=True, url="http://www.google.com")
    bookmark1.save()
    assert bookmark1.homepage is True

    bookmark2 = BookmarkFactory(user=user, homepage=True, url="http://www.yahoo.com")
    bookmark2.save()
    assert bookmark2.homepage is True

    # get current version of bookmark1 from the db:
    bm1 = Bookmark.objects.get(id=bookmark1.id)
    assert bm1.homepage is False


tag_list = [("red", "red"), ("RED", "red"), ("ReD", "red")]


@pytest.mark.django_db
@pytest.mark.parametrize("tag,expected", tag_list)
def test_bookmarktag_str(tag, expected):
    """The string representation of a bookmark tag should be the bookmark
    tag value (in lower case) followed by the username of the bookmark's author in
    parentheses.
    """

    username = "simpsonho"
    email = "homer@simpsons.com"
    user = UserFactory(username=username, email=email)
    bookmarktag = BookmarkTag(user=user, tag=tag)
    # we have to call the save method to convert the tag to lower case:
    bookmarktag.save()
    assert str(bookmarktag) == "{} ({})".format(expected, email)


@pytest.mark.django_db
def test_bookmark_tags_unique_to_user():
    """The tag 'red' created by one user is a different bookmark instance
    than another tag 'red' created by a different user.

    """

    tag = "Springfield"
    user1 = UserFactory(username="homer", email="homer@simpsons.com")
    bookmarktag1 = BookmarkTag(user=user1, tag=tag)
    bookmarktag1.save()

    user2 = UserFactory(username="bart", email="bart@simpsons.com")
    bookmarktag2 = BookmarkTag(user=user2, tag=tag)
    bookmarktag2.save()

    assert bookmarktag1.tag == bookmarktag2.tag
    assert bookmarktag1 != bookmarktag2
