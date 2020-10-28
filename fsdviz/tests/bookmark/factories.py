import factory
from django.contrib.auth import get_user_model

from bookmark_it.models import Bookmark, BookmarkTag


# Create your models here.

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ["username"]

    first_name = "Homer"
    last_name = "Simpson"
    username = "simpsonho"
    email = "homer@simpson.com"


class BookmarkTagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BookmarkTag
        django_get_or_create = ("user", "tag")

    user = factory.SubFactory(UserFactory)
    tag = "red"


class BookmarkFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Bookmark
        django_get_or_create = ("user", "url")

    title = "My Fake Bookmark"
    url = factory.Sequence(lambda n: "http://www.example.com/%04d" % n)
    description = "This is fake bookmark for testing"
    homepage = False
    user = factory.SubFactory(UserFactory)

    # many-to-many from factory boy docs:
    @factory.post_generation
    def tags(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for tag in extracted:
                self.tags.add(tag)
