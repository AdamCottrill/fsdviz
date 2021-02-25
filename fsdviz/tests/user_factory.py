import factory
from ..myusers.models import CustomUser


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CustomUser

    first_name = "John"
    last_name = "Doe"
    username = factory.Sequence(lambda n: "User {0}".format(n))
    email = factory.Sequence(lambda n: "johndoe{0}@hotmail.com".format(n))

    # admin = False
    password = "Abcd1234"

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override the default ``_create`` with our custom call."""
        manager = cls._get_manager(model_class)
        # The default would use ``manager.create(*args, **kwargs)``
        return manager.create_user(*args, **kwargs)
