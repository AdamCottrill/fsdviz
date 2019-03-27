"""Views for the api for our common models

The veiws in this file should all be publicly available as readonly.

"""

from rest_framework import viewsets


from fsdviz.stocking.models import (LifeStage, Condition, StockingMethod,
                                    StockingEvent)


from fsdviz.stocking.filters import StockingEventFilter

from .serializers import (LifeStageSerializer, ConditionSerializer,
                          StockingMethodSerializer,
                          StockingEventSerializer)


class LifeStageViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = LifeStage.objects.all()
    serializer_class = LifeStageSerializer


class ConditionViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = Condition.objects.all()
    serializer_class = ConditionSerializer


class StockingMethodViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = StockingMethod.objects.all()
    serializer_class = StockingMethodSerializer


class StockingEventViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = StockingEvent.objects.all()
    serializer_class = StockingEventSerializer
    filterset_class = StockingEventFilter
