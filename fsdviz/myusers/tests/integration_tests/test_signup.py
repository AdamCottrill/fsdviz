"""Integration tests for signup template

The signup view extends uses a custom template. The tests in this file
verify that the custom templates contains all of the necessary
elements including error messages and mark-up.

Tests in this file include:

+ form elements
+ form success
+ missing first_name
+ missing last_name
+ missing email
+ missing password1
+ missing password2
+ passwords do not match
+ passwords too short
+ username exists
+ email exists


"""
import pytest

from django.urls import reverse
from pytest_django.asserts import assertContains
from fsdviz.myusers.models import CustomUser as User
from fsdviz.myusers.tests.fixtures import joe_user


def test_form_elements(client):
    """verify that the signup form contains the expected elements."""

    response = client.get(reverse("signup"))
    assert "signup.html" in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode("utf-8")

    print(content)

    assert "Sign-Up" in content
    assert "First name:" in content
    assert "Last name:" in content
    assert "Email address:" in content
    assert "Password:" in content
    assert "Password confirmation:" in content


@pytest.mark.django_db
def test_form_success(client):
    """Verify that we can sign up a new user with our form."""

    data = {
        "first_name": "bart",
        "last_name": "simpson",
        "email": "bart@simpsons.com",
        "password1": "Django123",
        "password2": "Django123",
    }

    response = client.post(reverse("signup"), data=data, follow=True)

    assert "registration/login.html" in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode("utf-8")


@pytest.mark.django_db
def test_form_missing_lastname(client):
    """If we submit the form without a last name, we should see an
    bmo    appropriate error messages."""

    data = {
        "first_name": "bart",
        "email": "bart@simpsons.com",
        "password1": "Django123",
        "password2": "Django123",
    }

    response = client.post(reverse("signup"), data=data, follow=True)
    assert "signup.html" in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode("utf-8")

    assert "Please fix the errors in the form below" in content
    assert "This field is required." in content


@pytest.mark.django_db
def test_form_missing_firstname(client):
    """If we submit the form without a firstname, we should see an
    bmo    appropriate error messages."""

    data = {
        "last_name": "simpson",
        "email": "bart@simpsons.com",
        "password1": "Django123",
        "password2": "Django123",
    }

    response = client.post(reverse("signup"), data=data, follow=True)
    assert "signup.html" in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode("utf-8")

    assert "Please fix the errors in the form below" in content
    assert "This field is required." in content


@pytest.mark.django_db
def test_form_missing_email(client):
    """If we submit the form without an email, we should see an
    appropriate error messages."""

    data = {
        "first_name": "bart",
        "last_name": "simpson",
        "password1": "Django123",
        "password2": "Django123",
    }

    response = client.post(reverse("signup"), data=data, follow=True)

    assert "signup.html" in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode("utf-8")
    assert "Please fix the errors in the form below" in content
    assert "This field is required." in content


@pytest.mark.django_db
def test_form_malformed_email(client):
    """If we submit the form with an email that is malformed, we should
    see an appropriate error messages.

    """

    data = {
        "first_name": "bart",
        "last_name": "simpson",
        "email": "bartsimpson",
        "password1": "Django123",
        "password2": "Django123",
    }

    response = client.post(reverse("signup"), data=data, follow=True)

    assert "signup.html" in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode("utf-8")

    assert "Please fix the errors in the form below" in content
    assert "Enter a valid email address." in content


@pytest.mark.django_db
def test_form_missing_password1(client):
    """If we submit the form missing password1, we should
    see an appropriate error messages.

    """

    data = {
        "first_name": "bart",
        "last_name": "simpson",
        "email": "bart@simpsons.com",
        "password2": "Django123",
    }

    response = client.post(reverse("signup"), data=data, follow=True)

    assert "signup.html" in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode("utf-8")

    assert "Please fix the errors in the form below" in content
    assert "This field is required." in content


@pytest.mark.django_db
def test_form_missing_password2(client):
    """If we submit the form missing password2, we should
    see an appropriate error messages.

    """

    data = {
        "first_name": "bart",
        "last_name": "simpson",
        "email": "bart@simpsons.com",
        "password2": "Django123",
    }

    response = client.post(reverse("signup"), data=data, follow=True)

    assert "signup.html" in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode("utf-8")

    assert "Please fix the errors in the form below" in content
    assert "This field is required." in content


@pytest.mark.django_db
def test_form_password_mismatch(client):
    """If we submit the form with mis-matched passwords, we should
    see an appropriate error messages.

    """

    data = {
        "first_name": "bart",
        "last_name": "simpson",
        "email": "bart@simpsons.com",
        "password1": "123Django",
        "password2": "Django123",
    }

    response = client.post(reverse("signup"), data=data, follow=True)

    assert "signup.html" in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode("utf-8")

    assert "Please fix the errors in the form below" in content

    msg = '<li class="error">Password confirmation: The two password fields didn’t match.</li>'
    assertContains(response, msg, html=True)



@pytest.mark.django_db
def test_form_short_password(client):
    """If we submit the form with a password that is too short, we should
    see an appropriate error messages.

    """

    data = {
        "first_name": "bart",
        "last_name": "simpson",
        "email": "bart@simpsons.com",
        "password1": "2short",
        "password2": "2short",
    }

    response = client.post(reverse("signup"), data=data, follow=True)

    assert "signup.html" in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode("utf-8")

    assert "Please fix the errors in the form below" in content
    assert "This password is too short." in content
    assert "This password is too common." in content


@pytest.mark.django_db
def test_form_existing_email(client, joe_user):
    """If we submit the form with a email that already exists, we should
    see an appropriate error messages.

    """

    data = {
        "first_name": "bart",
        "last_name": "simpson",
        "email": joe_user.email,
        "password1": "Django123",
        "password2": "Django123",
    }

    response = client.post(reverse("signup"), data=data, follow=True)
    assert "signup.html" in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode("utf-8")
    assert "Please fix the errors in the form below" in content
    assert "User with this Email address already exists." in content


@pytest.mark.parametrize(
    "email",
    [
        "homer.simpson@simpsons.com",
        "HOMER.SIMPSON@SIMPSONS.COM",
        "Homer.Simpson@Simpsons.com",
    ],
)
@pytest.mark.django_db
def test_form_case_insensitive_email(client, email):
    """The email should always be converted to lowercase to ensure that
    Foo@bar.com is the same as foo@bar.com (which is consistent with the way email
    works)."""

    data = {
        "first_name": "homer",
        "last_name": "simpson",
        "email": email,
        "password1": "Django123",
        "password2": "Django123",
    }

    response = client.post(reverse("signup"), data=data, follow=True)

    assert "registration/login.html" in [t.name for t in response.templates]
    assert response.status_code == 200

    homer = User.objects.get(first_name="homer", last_name="simpson")
    assert homer.email == "homer.simpson@simpsons.com"
