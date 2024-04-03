import factory

from fsdviz.myusers.models import CustomUser

from fsdviz.tests.factories.common_factories import AgencyFactory


class UserFactory(factory.django.DjangoModelFactory):
    """
    A factory for User objects.
    """

    class Meta:
        model = CustomUser
        django_get_or_create = ("email",)
        skip_postgeneration_save = True

    username = "joeuser"
    first_name = ("Joe",)
    last_name = "User"
    email = factory.Sequence(lambda n: "joeuser_{}@gmail.com".format(n))

    role = "au"

    agency = factory.SubFactory(AgencyFactory)

    @factory.post_generation
    def lakes(self, create, extracted, **kwargs):
        if not create or not extracted:
            return
        self.lakes.add(*extracted)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override the default ``_create`` with our custom call."""
        manager = cls._get_manager(model_class)
        # The default would use ``manager.create(*args, **kwargs)``
        return manager.create_user(*args, **kwargs)
