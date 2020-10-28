from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.urls import reverse_lazy, reverse
from django.views import generic

from .forms import CustomUserCreationForm
from bookmark_it.models import Bookmark


class SignUp(generic.CreateView):
    form_class = CustomUserCreationForm
    success_url = reverse_lazy("login")
    template_name = "signup.html"


@login_required
def account_redirect(request):
    """if there is a next argument, use it, if not see if the user has an
    identified home page. If so rediect to it. if not rediect to the
    default, basin-wide map."""

    user = request.user

    next_page = request.POST.get("next")
    if next_page:
        return redirect(next_page)

    bm = Bookmark.objects.filter(user=user, homepage=True).first()
    if bm:
        url = bm.url
    else:
        url = reverse("home")

    return redirect(url)
