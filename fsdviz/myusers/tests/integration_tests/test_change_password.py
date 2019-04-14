"""Integration tests for the change password template

The change password view uses django's built view but uses custom
template. The tests in this file verify that the custom template
contains all of the necessary elements including error messages and
mark-up.

Tests in this file include:

+ change password login required
+ change password form elements
+ change password form success
+ missing old password
+ old password is incorrect
+ missing password1
+ missing password2
+ passwords don't match
+ password too short
+ password too common

"""
import pytest

from django.urls import reverse

from fsdviz.myusers.models import CustomUser

from fsdviz.myusers.tests.fixtures import joe_user


def test_change_password_form_anonymous_user(client):
    """if someone who is not logged in tried to access the change-password
    url, they should be re-directed to the login page"""

    response = client.get(reverse('password_change'), follow=True)
    assert 'registration/login.html' in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode('utf-8')

    assert "Login" in content
    assert "Email address:" in content
    assert "Password:" in content


def test_change_password_form_user(client, joe_user):
    """if someone a logged-in user accessed the change-password url, they
    see a form with elements for old password, new passord1, and new
    password2.

    """

    email = joe_user.email
    password = 'Abcd1234'

    client.login(username=email, password=password)

    response = client.get(reverse('password_change'), follow=True)
    assert 'registration/password_change_form.html' in [
        t.name for t in response.templates
    ]
    assert response.status_code == 200

    content = response.content.decode('utf-8')

    assert "Change Your Password:" in content
    assert "Old password:" in content
    assert "New password:" in content
    assert "New password confirmation:" in content
    assert "Change my password" in content


@pytest.mark.django_db
def test_change_password_form_success(client, joe_user):
    """Verify that a logged in user can change their password."""

    email = joe_user.email
    password = 'Abcd1234'
    new_password = '1234Abcd!@#'

    client.login(username=email, password=password)

    data = {
        'old_password': password,
        'new_password1': new_password,
        'new_password2': new_password,
    }

    url = reverse('password_change')
    response = client.post(url, data=data, follow=True)
    content = response.content.decode('utf-8')

    template = 'registration/password_change_done.html'
    assert template in [t.name for t in response.templates]
    assert response.status_code == 200
    assert response.context['user'].is_authenticated is True

    assert "Password Change Successful" in content
    assert "Your password has been changed." in content

    #verify that the password for our user has been updated:
    user = CustomUser.objects.get(email=email)
    assert user.check_password(new_password)


@pytest.mark.django_db
def test_change_password_missing_old_password(client, joe_user):
    """if a user submits the form without their old password, we should see
    a meaningful message and the user's password should be unchanged."""

    email = joe_user.email
    password = 'Abcd1234'
    new_password = '1234Abcd!@#'

    client.login(username=email, password=password)

    data = {
        'new_password1': new_password,
        'new_password2': new_password,
    }

    url = reverse('password_change')
    response = client.post(url, data=data, follow=True)

    template = 'registration/password_change_form.html'
    assert template in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode('utf-8')
    assert "Please fix the errors in the form below." in content
    assert "This field is required." in content

    #verify that the password for our user has *NOT* been updated:
    user = CustomUser.objects.get(email=email)
    assert user.check_password(password) is True
    assert user.check_password(new_password) is False


@pytest.mark.django_db
def test_change_password_incorrect_old_password(client, joe_user):
    """if a user submit the form without the an incorrect password, we should see
    a meaningful message and the user's password should be unchanged."""

    email = joe_user.email
    password = 'Abcd1234'
    new_password = '1234Abcd!@#'

    client.login(username=email, password=password)

    data = {
        'old_password': 'WrongPassword!@#',
        'new_password1': new_password,
        'new_password2': new_password,
    }

    url = reverse('password_change')
    response = client.post(url, data=data, follow=True)

    template = 'registration/password_change_form.html'
    assert template in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode('utf-8')
    assert "Please fix the errors in the form below." in content
    msg = "Your old password was entered incorrectly. Please enter it again."
    assert msg in content

    #verify that the password for our user has *NOT* been updated:
    user = CustomUser.objects.get(email=email)
    assert user.check_password(password) is True
    assert user.check_password(new_password) is False


@pytest.mark.django_db
def test_change_password_missing_new_passwords(client, joe_user):
    """If a user forgets either the first or second new password, they
    sould get a useful message and their password should remain
    unchanged."""

    email = joe_user.email
    password = 'Abcd1234'
    new_password = '1234Abcd!@#'

    client.login(username=email, password=password)

    #dictionaries missing password1 and then password2
    data_list = [{
        'old_password': password,
        'new_password2': new_password,
    }, {
        'old_password': password,
        'new_password1': new_password,
    }]
    url = reverse('password_change')

    for data in data_list:

        response = client.post(url, data=data, follow=True)

        template = 'registration/password_change_form.html'
        assert template in [t.name for t in response.templates]
        assert response.status_code == 200

        content = response.content.decode('utf-8')
        assert "Please fix the errors in the form below." in content
        assert "This field is required." in content

        #verify that the password for our user has been updated:
        user = CustomUser.objects.get(email=email)
        assert user.check_password(password) is True
        assert user.check_password(new_password) is False


@pytest.mark.django_db
def test_change_new_password_mismatch(client, joe_user):
    """if a user submit the form and the new passwords don't match, we should see
    a meaningful message and the user's password should be unchanged."""

    email = joe_user.email
    password = 'Abcd1234'

    client.login(username=email, password=password)

    data = {
        'old_password': password,
        'new_password1': 'WrongPassword!@#',
        'new_password2': 'WrongPassword-!@#'  #extra hyphen
    }

    url = reverse('password_change')
    response = client.post(url, data=data, follow=True)

    template = 'registration/password_change_form.html'
    assert template in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode('utf-8')

    assert "Please fix the errors in the form below." in content
    msg = "The two password fields didn&#39;t match."
    assert msg in content

    #verify that the password for our user has *NOT* been updated:
    user = CustomUser.objects.get(email=email)
    assert user.check_password(password) is True


@pytest.mark.django_db
def test_change_new_password_too_short(client, joe_user):
    """if a user submit the form and the new passwords are too short, we
    should see a meaningful message and the user's password should be
    unchanged.

    """

    email = joe_user.email
    password = 'Abcd1234'

    client.login(username=email, password=password)

    data = {
        'old_password': password,
        #short but uncommon:
        'new_password1': 'Foo!@#',
        'new_password2': 'Foo!@#'
    }

    url = reverse('password_change')
    response = client.post(url, data=data, follow=True)

    template = 'registration/password_change_form.html'
    assert template in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode('utf-8')
    assert "Please fix the errors in the form below." in content
    msg = "This password is too short. It must contain at least 8 characters."
    assert msg in content

    #verify that the password for our user has *NOT* been updated:
    user = CustomUser.objects.get(email=email)
    assert user.check_password(password) is True



@pytest.mark.django_db
def test_change_new_password_too_common(client, joe_user):
    """if a user submit the form and the new passwords are too common, we
    should see a meaningful message and the user's password should be
    unchanged.

    """

    email = joe_user.email
    password = 'Abcd1234'

    client.login(username=email, password=password)

    data = {
        'old_password': password,
        #the most common password:
        'new_password1': 'password',
        'new_password2': 'password'
    }

    url = reverse('password_change')
    response = client.post(url, data=data, follow=True)

    template = 'registration/password_change_form.html'
    assert template in [t.name for t in response.templates]
    assert response.status_code == 200

    content = response.content.decode('utf-8')
    assert "Please fix the errors in the form below." in content
    msg = "This password is too common."
    assert msg in content

    #verify that the password for our user has *NOT* been updated:
    user = CustomUser.objects.get(email=email)
    assert user.check_password(password) is True
