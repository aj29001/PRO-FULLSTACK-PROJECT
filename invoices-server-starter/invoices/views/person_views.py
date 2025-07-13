from django.utils import timezone
from rest_framework import viewsets, status
from django.db.models import Sum
from rest_framework.response import Response
from rest_framework.decorators import action
from ..models import Person, Invoice
from ..serializers import PersonSerializer, InvoiceSerializer


class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.filter(hidden=False)
    serializer_class = PersonSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance.hidden = True
        instance.save(update_fields=["hidden"])
        validated_data = serializer.validated_data
        validated_data.pop('hidden', None)
        new_instance = Person.objects.create(**validated_data, hidden=False)
        output_serializer = self.get_serializer(new_instance)
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.hidden = True
        instance.save(update_fields=["hidden"])
        return Response(status=status.HTTP_204_NO_CONTENT)

class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.all()
    serializer_class = PersonSerializer

    @action(detail=False, methods=['get'], url_path='statistics')
    def statistics(self, request):
        persons = Person.objects.all()
        current_year = timezone.now().year
        years = [current_year - i for i in range(5)]
        result = []

        for person in persons:
            revenue = Invoice.objects.filter(seller=person).aggregate(Sum('price'))['price__sum'] or 0

            revenue_per_year = {}
            for y in years:
                rev = Invoice.objects.filter(seller=person, issued__year=y).aggregate(Sum('price'))['price__sum'] or 0
                revenue_per_year[str(y)] = float(rev)
                expenses_per_year = {}
                for y in years:
                    rev = Invoice.objects.filter(seller=person, issued__year=y).aggregate(Sum('price'))[
                              'price__sum'] or 0
                    exp = Invoice.objects.filter(buyer=person, issued__year=y).aggregate(Sum('price'))[
                              'price__sum'] or 0
                    revenue_per_year[str(y)] = float(rev)
                    expenses_per_year[str(y)] = float(exp)

            result.append({
                "personId": person.id,
                "personName": person.name,
                "revenue": float(revenue),
                "revenuePerYear": revenue_per_year,
                "expensesPerYear": expenses_per_year,
            })

        return Response(result)

