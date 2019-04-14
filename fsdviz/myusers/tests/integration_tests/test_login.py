"""Integration tests for the login template

The login view extends uses a custom template. The tests in this file
verify that the custom templates contains all of the necessary
elements including error messages and mark-up.

Tests in this file include:

+ login form elements
+ login form success
+ missing email (username)
+ missing password
+ wrong email (user does exsit)
+ wrong password (for existing user)

"""
import pytest

from django.urls import reverse

from fsdviz.myusers.models import CustomUser

from fsdviz.myusers.tests.fixtures import joe_user


def test_login_form_elements(client):
    """verify that the login form contains the expected elements."""

    response = client.get(reverse('login'))
    assert 'registration/login.html' in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode('utf-8')

    assert "Login" in content
    assert "Email address:" in content
    assert "Password:" in content


@pytest.mark.xfail
@pytest.mark.django_db
def test_login_form_success(client, joe_user):
    """Verify that we can sign up a new user with our form."""

    # make sure that our user is in the database and has the password we think.
    email = 'joeuser@gmail.com'
    password = "Abcd1234"
    user = CustomUser.objects.get(email=email)
    assert user
    assert user.check_password(password)

    data = {'username': email, 'password': password}

    url = reverse('login')
    print("url = {}".format(url))

    response = client.post(url, data=data, follow=True)
    assert 'home.html' in [t.name for t in response.templates]
    assert response.status_code == 200
    assert response.context['user'].is_authenticated is True

    content = response.content.decode('utf-8')
    assert "Hello Joe User" in content


@pytest.mark.django_db
def test_login_form_missing_email(client):
    """If we submit the form without an e-mail we should get a meaningful
    message."""

    data = {
        'password': 'Abcd1234',
    }

    response = client.post(reverse('login'), data=data, follow=True)
    assert 'registration/login.html' in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode('utf-8')
    assert "Please fix the errors in the form below." in content
    assert "This field is required." in content


@pytest.mark.django_db
def test_login_form_missing_password(client):
    """If we submit the form without a password we should get a meaningful
    message."""

    data = {'username': 'joeuser@gmail.com'}

    response = client.post(reverse('login'), data=data, follow=True)
    assert 'registration/login.html' in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode('utf-8')
    assert "Please fix the errors in the form below." in content
    assert "This field is required." in content


@pytest.mark.django_db
def test_login_form_unknown_user(client, joe_user):
    """If we submit the form for a user with the wrong password, we should
    get a meaningful message that does indicate that the user is known
    and just the password it wrong - this can be a security
    vulnerability. Just indicate that there is a problem with one of
    the fields.

    """

    data = {'username': 'joeuser@gmail.com', 'password': 'Abcd1234'}

    response = client.post(reverse('login'), data=data, follow=True)
    assert 'registration/login.html' in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode('utf-8')

    msg = ("Please enter a correct Email address and password. " +
           "Note that both fields may be case-sensitive.")

    assert "Please fix the errors in the form below." in content
    assert msg in content


@pytest.mark.django_db
def test_login_form_unknown_user(client):
    """If we submit the form for an unknown user, we should get a meaningful
    message that does indicate that they user is unknown."""

    data = {'username': 'homersimpson@gmail.com', 'password': 'Abcd1234'}

    response = client.post(reverse('login'), data=data, follow=True)
    assert 'registration/login.html' in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode('utf-8')

    msg = ("Please enter a correct Email address and password. " +
           "Note that both fields may be case-sensitive.")

    assert "Please fix the errors in the form below." in content
    assert msg in content
