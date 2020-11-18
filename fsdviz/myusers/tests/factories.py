import factory

from fsdviz.myusers.models import CustomUser

from fsdviz.tests.common_factories import AgencyFactory


class UserFactory(factory.DjangoModelFactory):
    """
    A factory for Lake objects.
    """

    class Meta:
        model = CustomUser
        django_get_or_create = ("email",)

    username = "joeuser"
    first_name = ("Joe",)
    last_name = "User"
    email = factory.Sequence(lambda n: "joeuser_{}@gmail.com".format(n))

    role = "au"

    agency = factory.SubFactory(AgencyFactory)

    @factory.post_generation
    def lakes(self, create, extracted, **kwargs):
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of lakes were passed in, use them
            for lake in extracted:
                self.lakes.add(lake)
