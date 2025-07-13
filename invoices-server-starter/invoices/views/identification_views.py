from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Person, Invoice
from ..serializers import InvoiceSerializer

class IdentificationViewSet(viewsets.ViewSet):

    @action(detail=True, methods=["get"], url_path="sales")
    def sales(self, request, pk=None):
        identification_number = pk
        sellers = Person.objects.filter(identificationNumber=identification_number, hidden=False)

        if not sellers.exists():
            return Response({"detail": "No person found with given identification number."},
                            status=status.HTTP_404_NOT_FOUND)

        invoices = Invoice.objects.filter(seller__in=sellers, hidden=False)
        serializer = InvoiceSerializer(invoices, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="purchases")
    def purchases(self, request, pk=None):
        identification_number = pk
        buyers = Person.objects.filter(identificationNumber=identification_number, hidden=False)

        if not buyers.exists():
            return Response({"detail": "No person found with given identification number."},
                            status=status.HTTP_404_NOT_FOUND)

        invoices = Invoice.objects.filter(buyer__in=buyers, hidden=False)
        serializer = InvoiceSerializer(invoices, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="both")
    def both(self, request, pk=None):
        identification_number = pk
        person = Person.objects.filter(identificationNumber=identification_number, hidden=False)

        if not person.exists():
            return Response({"detail": "No person found with given identification number."},
                            status=status.HTTP_404_NOT_FOUND)


