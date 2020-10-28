"""
=============================================================
 c:/Users/COTTRILLAD/1work/Python/djcode/apps/bookmark_it/bookmark_it/tests/integration_tests/test_bookmark_crud.py
 Created: 20 Aug 2020 11:10:18

 DESCRIPTION:

+ verify that only logged in users can create, update, or delete bookmarks
+ the logged int user is automacally the bookmarks owner
+ only the owner can update or delete bookmarks.

 A. Cottrill
=============================================================
"""


import pytest

from django.urls import reverse
from django.utils.html import escape
from pytest_django.asserts import assertTemplateUsed, assertContains, assertNotContains
from bookmark_it.models import Bookmark, BookmarkTag
from ..factories import UserFactory, BookmarkFactory, BookmarkTagFactory

USER_PASSWORD = "Abcd1234"


@pytest.fixture
def bookmark():
    """A single bookmark object with default values.
    """
    bookmark = BookmarkFactory()
    return bookmark


@pytest.fixture
def db_setup():
    """This fixture will create several bookmarks for several users to and
    will be used by most of the tests in this file.

    there will be three users - Homer, Bart and Barney - who will have
    two, one and no bookmarks.  The bookmarks will have distinct tags
    required for the testing scenarios

    """

    homer = UserFactory(username="homer", email="homer@simpsons.com")
    homer.set_password(USER_PASSWORD)
    homer.save()

    bart = UserFactory(username="bart", email="bart@simpsons.com")
    bart.set_password(USER_PASSWORD)
    bart.save()

    barney = UserFactory(username="barney", email="barney@simpsons.com")
    barney.set_password(USER_PASSWORD)
    barney.save()

    bm1 = BookmarkFactory(
        user=homer,
        url="http://www.thesimpsons.com",
        title="Homers first bookmark",
        description="the history of donuts",
        homepage=True,
    )
    bm1.save()

    bm2 = BookmarkFactory(
        user=homer, title="Homers second bookmark", description="The history of beer"
    )
    bm2.save()
    bmt1 = BookmarkTagFactory(user=homer, tag="history")
    bmt2 = BookmarkTagFactory(user=homer, tag="beer")

    bm2.tags.add(bmt1, bmt2)
    bm2.save()

    # bm3 is authored by bart:
    bm3 = BookmarkFactory(
        user=bart,
        title="Barts 1st bookmark",
        description="The history of homemade fireworks.",
    )
    bm3.save()

    setup = {"homer": homer, "bart": bart, "barney": barney, "bm1": bm1, "bm2": bm2}

    return setup


protected_urls = [
    ("bookmark_it:bookmark_list", False),
    ("bookmark_it:bookmark_new", False),
    ("bookmark_it:bookmark_detail", True),
    ("bookmark_it:bookmark_edit", True),
    ("bookmark_it:bookmark_delete", True),
    ("bookmark_it:bookmark_make_homepage", True),
]


@pytest.mark.django_db
@pytest.mark.parametrize("url_name, requires_bookmark", protected_urls)
def test_annon_user_redirected_to_login_page(
    client, bookmark, url_name, requires_bookmark
):
    """Verify that an annonomous user is redirected to the login page if
    they try to access any of the protected routes:

    Note - this should be a parameterized test that accepts the url
    names for each of the protected routes (list, create, detail,
    update, delete).  The resposne should always be the same.

    """
    if requires_bookmark:
        url = reverse(url_name, args=[bookmark.id])
    else:
        url = reverse(url_name)

    response = client.get(url)
    assert response.status_code == 302


@pytest.mark.django_db
def test_user_sees_only_their_bookmarks(client, db_setup):
    """When a user views the bookmark list, they should only see their
    bookmarks, and no bookmarks by any other user.

    """

    user = db_setup.get("homer")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_list")
    response = client.get(url)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_list.html")

    expected = ["Homers first bookmark", "Homers second bookmark"]
    for item in expected:
        assertContains(response, item)

    excluded = "Barts 1st bookmark"
    assertNotContains(response, excluded)


@pytest.mark.django_db
def test_no_bookmarks_yet(client, db_setup):
    """If a logged in user does not have any bookmarks but views the
    bookmark list, the response should contains a meaningful message
    to that effect.

    """

    user = db_setup.get("barney")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_list")
    response = client.get(url)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_list.html")

    expected = "It doesn't look like you have any bookmarks yet."
    assertContains(response, expected)


@pytest.mark.django_db
def test_no_bookmarks_match_that_criteria(client, db_setup):
    """If a logged searches for a string that does not match any of their
    bookmarks, the message should indicate that there are no nookmarks
    that match the criteria.

    """

    user = db_setup.get("homer")

    contains = "foobarbaz123"

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_list")
    response = client.get(url, {"contains": contains})

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_list.html")

    expected = "It doesn't look like you have any bookmarks that match that criteria."
    assertContains(response, expected)

    assertContains(response, contains)


@pytest.mark.django_db
def test_tag_links_render_on_bookmarks_list(client, db_setup):
    """When a user views their bookmark list - links to the tags should be
    incldued in the respose, but it should NOT include links to tags
    associated with other user's bookmarks.

    """

    user = db_setup.get("homer")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_list")
    response = client.get(url)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_list.html")

    keywords = ["history", "beer"]
    for word in keywords:
        expected = "?tag={}".format(word)
        assertContains(response, expected)


@pytest.mark.django_db
def test_user_sees_bookmarks_filtered_by_tag(client, db_setup):
    """When a user views the bookmark list that includes a tag filter,
    they should only see their bookmarks that are associated with that
    tag, and not bookmarks that do not have that tag or where created
    by any other user.

    """

    user = db_setup.get("homer")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_list")
    response = client.get(url, {"tag": "beer"})

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_list.html")

    assertContains(response, "Homers second bookmark")
    assertNotContains(response, "Homers first bookmark")


@pytest.mark.django_db
@pytest.mark.parametrize(
    "criteria", ["second", "SECOND", "SeCoNd", "beer", "BEER", "BeEr"]
)
def test_user_sees_filtered_bookmarks(client, db_setup, criteria):
    """When a user views the bookmark list that includes "contains"
    filter, they should only see their bookmarks that contain that tag
    in their title or description, and not bookmarks that do not have
    that phrase in their title or description, or bookmarks where
    created by any other user.  The search criteria is not case
    sensitve and should be included in the response.

    """

    user = db_setup.get("homer")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_list")
    response = client.get(url, {"contains": criteria})

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_list.html")

    assertContains(response, criteria)

    assertContains(response, "Homers second bookmark")
    assertNotContains(response, "Homers first bookmark")


@pytest.mark.django_db
def test_bookmark_detail_elements(client, db_setup):
    """The bookmark detail page should include a number of basic elements:

    + title,
    + description,
    + url,
    + edit button and url,
    + delete button and ulr,
    + make homepage button and url

    """

    user = db_setup.get("homer")
    bm = db_setup.get("bm1")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_detail", args=[bm.id])
    response = client.get(url)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_detail.html")

    assertContains(response, bm.title)
    assertContains(response, bm.description)
    assertContains(response, bm.url)
    assertNotContains(response, "Tags")

    url = reverse("bookmark_it:bookmark_edit", args=[bm.id])
    assertContains(response, url)

    url = reverse("bookmark_it:bookmark_delete", args=[bm.id])
    assertContains(response, url)

    url = reverse("bookmark_it:bookmark_list")
    assertContains(response, url)

    # we don't people to access the url directly anymore:
    # url = reverse("bookmark_it:bookmark_new")
    # assertContains(response, url)


@pytest.mark.django_db
def test_bookmark_detail_tags_render(client, db_setup):
    """If the bookmark has tags, they should be rendered on the page:
    """

    user = db_setup.get("homer")
    bm = db_setup.get("bm2")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_detail", args=[bm.id])
    response = client.get(url)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_detail.html")

    assertContains(response, "beer")
    assertContains(response, "history")


@pytest.mark.django_db
def test_user_is_bookmark_owner(client, db_setup):
    """When the user creates a new bookmark - they should automacally be
    the user associated with it.

    """

    user = db_setup.get("barney")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    payload = {
        "title": "Barneys Bookmark",
        "description": "the bars of the world",
        "url": "http://thebows.com",
    }

    url = reverse("bookmark_it:bookmark_new")
    response = client.post(url, data=payload, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_detail.html")

    bookmark = Bookmark.objects.get(title=payload["title"])
    assert bookmark.user == user


@pytest.mark.django_db
def test_new_bookmarktags_created_from_keywords(client, db_setup):
    """When a bookmark is create or edited and a new keyword is added to
    the list of keywords a new bookmark tag is created.

    """

    user = db_setup.get("barney")
    keywords = ["alpha", "beta", "theta"]

    # make sure they are not in the database yet:
    db_keywords = [x.tag for x in BookmarkTag.objects.filter(user=user)]
    for kw in keywords:
        assert kw not in db_keywords

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    payload = {
        "title": "Barneys Bookmark",
        "description": "the bars of the world",
        "url": "http://thebows.com",
        "keywords": ", ".join(keywords),
    }

    url = reverse("bookmark_it:bookmark_new")
    response = client.post(url, data=payload, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_detail.html")

    db_keywords = [x.tag for x in BookmarkTag.objects.filter(user=user)]

    for kw in keywords:
        assert kw in db_keywords


@pytest.mark.django_db
def test_unique_urls_within_user(client, db_setup):
    """Each user can only bookmark a url once - this test ensure that if a
    user tries to create a second bookmark for the same url, an error
    message is incldued in the response and a duplicate bookmark is not
    created.

    """

    # homer already has already bookmarked 'http://www.thesimpsons.com'
    user = db_setup.get("homer")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    payload = {
        "url": "http://www.thesimpsons.com",
        "title": "Homers first Bookmark",
        "description": "the bars of the world",
    }

    url = reverse("bookmark_it:bookmark_new")
    response = client.post(url, data=payload, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_form.html")

    msg = "You already have a bookmark for that url."
    assertContains(response, msg)


@pytest.mark.django_db
def test_duplicate_urls_allowed_different_users(client, db_setup):
    """Different users should be able to create bookmarks to the same url.

    """

    # bart does not have the url 'http://www.thesimpsons.com' so he
    # should be able to create a new bookmark.

    user = db_setup.get("bart")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    payload = {
        "url": "http://www.thesimpsons.com",
        "title": "Homers first Bookmark",
        "description": "the bars of the world",
    }

    url = reverse("bookmark_it:bookmark_new")
    response = client.post(url, data=payload, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_detail.html")

    msg = "You already have a bookmark for that url."
    assertNotContains(response, msg)


@pytest.mark.xfail
@pytest.mark.django_db
def test_owner_can_update_bookmark(client, db_setup):
    """The bookmark owner should be able to update an bookmark they
    created.

    The url field has now been made readonly for existing bookmarks so
    this test fails.
    """

    user = db_setup.get("homer")
    bm = db_setup.get("bm1")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    payload = {
        "title": "New Title",
        "description": "New Description",
        "url": "http://simpsons.com",
    }

    url = reverse("bookmark_it:bookmark_edit", args=[bm.id])
    response = client.post(url, data=payload, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_detail.html")

    bookmark = Bookmark.objects.get(pk=bm.id)
    assert bookmark.title == payload["title"]
    assert bookmark.description == payload["description"]
    assert bookmark.url == payload["url"]


@pytest.mark.xfail
@pytest.mark.django_db
def test_owner_cannot_update_bookmark_with_duplicate_url(client, db_setup):
    """If the user accidentally update the url of a bookmark to match and
    existing url, they will should recieve an appropriate error
    message.

    The url field has now been made readonly for existing bookmarks so
    this test fails.

    """

    user = db_setup.get("homer")
    bm1 = db_setup.get("bm1")
    bm2 = db_setup.get("bm2")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    payload = {"title": bm1.title, "description": bm1.description, "url": bm1.url}

    url = reverse("bookmark_it:bookmark_edit", args=[bm2.id])
    response = client.post(url, data=payload)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_form.html")

    msg = "You already have a bookmark for that url."
    assertContains(response, msg)


@pytest.mark.django_db
def test_owner_can_delete_bookmark(client, db_setup):
    """A bookmark owner should be able to delete a bookmark they created."""

    user = db_setup.get("homer")
    bm = db_setup.get("bm1")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_delete", args=[bm.id])
    response = client.post(url, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_list.html")

    bookmark = Bookmark.objects.filter(pk=bm.id).first()
    assert bookmark is None


protected_urls = [
    "bookmark_it:bookmark_detail",
    "bookmark_it:bookmark_edit",
    "bookmark_it:bookmark_delete",
    "bookmark_it:bookmark_make_homepage",
]


@pytest.mark.django_db
@pytest.mark.parametrize("url_name", protected_urls)
def test_nonowner_cannot_see_update_or_delete_bookmark(client, db_setup, url_name):
    """If a logged in user tries to access any urls associated with a
    bookmark that is not theirs, they should be re-directed to their own
    bookmark list.

    """

    user = db_setup.get("barney")
    bm = db_setup.get("bm1")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse(url_name, args=[bm.id])
    response = client.get(url)
    assert response.status_code == 302

    # follow the response and make sure that we are returned to our bookmark list:
    response = client.get(url, follow=True)
    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_list.html")


@pytest.mark.django_db
def test_owner_can_make_bookmark_homepage(client, db_setup):
    """A bookmark owner can updated the status of a bookmark to his or her
    homepage using the bookmark_make_homepage view.

    Arguments:
    - `client`:
    - `db_setup`:

    """

    user = db_setup.get("homer")
    bm = db_setup.get("bm2")
    assert bm.homepage is False

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_make_homepage", args=[bm.id])
    response = client.get(url, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_detail.html")

    # verify that the homepage is our bookmark.
    homepage = Bookmark.objects.get(user=user, homepage=True)
    assert homepage.id == bm.id


@pytest.mark.django_db
def test_owner_cannot_make_bookmark_homepage_twice(client, db_setup):
    """If a user tries to make the bookmark that is their homepage, their
    homepage again, nothing should happen.

    Arguments:
    - `client`:
    - `db_setup`:

    """

    user = db_setup.get("homer")
    # bm1 is already homer's homepage
    bm = db_setup.get("bm1")
    assert bm.homepage is True

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_make_homepage", args=[bm.id])
    response = client.get(url, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_detail.html")

    # verify that the status of the bookmark did not change:
    bm = Bookmark.objects.get(id=bm.id)
    assert bm.homepage is True


@pytest.mark.django_db
def test_make_homepage_link_appears_if_homepage_is_false(client, db_setup):
    """The bookmark detail pages should include a linke to the make
    homepage view if the bookmark is not currently the homepage for this
    user.

    Arguments:
    - `client`:
    - `db_setup`:

    """
    user = db_setup.get("homer")
    # homer's second bookmark is NOT his homepage.
    bm = db_setup.get("bm2")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_detail", args=[bm.id])
    response = client.get(url)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_detail.html")

    link = reverse("bookmark_it:bookmark_make_homepage", args=[bm.pk])
    assertContains(response, link)


@pytest.mark.django_db
def test_make_homepage_link_does_not_render_if_homepage_true(client, db_setup):
    """The bookmark detail pages should NOT include a link to the make
    homepage view if the bookmark is not currently the homepage for this
    user.

    Arguments:
    - `client`:
    - `db_setup`:

    """
    user = db_setup.get("homer")
    bm = db_setup.get("bm1")

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_detail", args=[bm.id])
    response = client.get(url)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_detail.html")

    link = reverse("bookmark_it:bookmark_make_homepage", args=[bm.pk])
    assertNotContains(response, link)


@pytest.mark.django_db
def test_nonowner_cannot_make_bookmark_homepage(client, db_setup):
    """If a user who is not the bookmark owner tries to access the
    bookmark_make_homepage view, they should be returned to the
    bookmark list and the status of the bookmark should not change.

    Arguments:
    - `client`:
    - `db_setup`:

    """

    user = db_setup.get("barney")
    bm = db_setup.get("bm2")
    assert bm.homepage is False

    login = client.login(username=user.email, password=USER_PASSWORD)
    assert login is True

    url = reverse("bookmark_it:bookmark_make_homepage", args=[bm.id])
    response = client.get(url, follow=True)

    assert response.status_code == 200
    assertTemplateUsed(response, "bookmark_it/bookmark_list.html")

    link = reverse("bookmark_it:bookmark_make_homepage", args=[bm.pk])
    assertNotContains(response, link)

    # verify that the status of the bookmark did not change:
    bm = Bookmark.objects.get(id=bm.id)
    assert bm.homepage is False
