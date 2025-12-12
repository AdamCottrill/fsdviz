import factory
#from django.contrib.auth import get_user_model

from bookmark_it.models import Bookmark, BookmarkTag

from fsdviz.myusers.tests.factories import UserFactory


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
        skip_postgeneration_save = True

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
