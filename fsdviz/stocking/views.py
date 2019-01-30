from django.shortcuts import render

from django.views.generic.detail import DetailView
from django.views.generic.list import ListView

from .models import StockingEvent
from ..common.models import Lake


class StockingEventListView(ListView):

    model = StockingEvent
    paginate_by = 50  # if pagination is desired
    template_name = 'stocking\stocking_event_list.html'

    def get_context_data(self, **kwargs):
        context = super(StockingEventListView,
                        self).get_context_data(**kwargs)

        lake_name = self.kwargs.get('lake_name')
        if lake_name:
            lake = Lake.objects.get(abbrev=lake_name)
            context['lake'] = lake

            years = StockingEvent.objects.\
                    filter(lake=lake).values_list('year').\
                    distinct().order_by('-year')
            context['years'] = [x[0] for x in years]

        year = self.kwargs.get('year')
        if year:
            context['year'] = int(year)

        return context


    def get_queryset(self):

        lake_name = self.kwargs.get('lake_name')
        year = self.kwargs.get('year')

        queryset = StockingEvent.objects.all()

        if lake_name:
            # Return a filtered queryset
            queryset = queryset.filter(lake__abbrev=lake_name)

        if year:
            queryset = queryset.filter(year=year)
        return queryset






class StockingEventDetailView(DetailView):

    model = StockingEvent

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context
