from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models.functions import Lower
from django.db.models import Sum
from datetime import date

from ..models import Invoice, Person
from ..serializers import InvoiceSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        try:
            include_archived = request.query_params.get("include_archived") in ["1", "true", "True"]
            today = timezone.now().date()
            year_start = today.replace(month=1, day=1)
            if include_archived:
                qs = Invoice.objects.all()
            else:
                qs = Invoice.objects.filter(hidden=False)

            current_year_sum = qs.filter(issued__gte=year_start).aggregate(s=Sum("price"))["s"] or 0
            all_time_sum = qs.aggregate(s=Sum("price"))["s"] or 0
            invoices_count = qs.count()

            return Response({
                "currentYearSum": float(current_year_sum),
                "allTimeSum": float(all_time_sum),
                "invoicesCount": invoices_count
            }, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_queryset(self):
        import unicodedata
        from django.db.models import Q

        params = self.request.query_params
        queryset = Invoice.objects.filter(hidden=False)

        # Filtr podle buyerID (odběratel)
        buyer_id = params.get("buyerID")
        if buyer_id:
            queryset = queryset.filter(buyer__id=buyer_id)

        # Filtr podle sellerID (dodavatel)
        seller_id = params.get("sellerID")
        if seller_id:
            queryset = queryset.filter(seller__id=seller_id)

        # Filtr podle názvu produktu (přesný název ze selectu)
        product = params.get("product")
        if product:
            queryset = queryset.filter(product=product)

        # Filtr podle IČ odběratele (částečná shoda)
        buyer_ic = params.get("buyerIC")
        if buyer_ic:
            queryset = queryset.filter(buyer__identificationNumber__icontains=buyer_ic)

        # Filtr podle IČ dodavatele (částečná shoda)
        seller_ic = params.get("sellerIC")
        if seller_ic:
            queryset = queryset.filter(seller__identificationNumber__icontains=seller_ic)

        # Filtr podle názvu produktu (fulltext, bez diakritiky a case insensitive)
        product_search = params.get("productSearch")
        if product_search:
            def normalize(s):
                return ''.join(
                    c for c in unicodedata.normalize('NFD', s)
                    if unicodedata.category(c) != 'Mn'
                ).lower()

            # Normální dotaz pro case/diakritika insensitive hledání
            # Poznámka: V PostgreSQL by šlo použít unaccent. Takhle to děláme v Pythonu.
            all_ids = [
                inv.id for inv in queryset
                if normalize(product_search) in normalize(inv.product or "")
            ]
            queryset = queryset.filter(id__in=all_ids)

        # Filtr ceny
        min_price = params.get("minPrice")
        if min_price:
            try:
                queryset = queryset.filter(price__gte=float(min_price))
            except (ValueError, TypeError):
                pass

        max_price = params.get("maxPrice")
        if max_price:
            try:
                queryset = queryset.filter(price__lte=float(max_price))
            except (ValueError, TypeError):
                pass

        # Omezení počtu výsledků
        limit = params.get("limit")
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except (ValueError, TypeError):
                pass

        return queryset

    @action(detail=False, methods=["get"], url_path="product")
    def product_options(self, request):
        """
        Vrátí seznam unikátních produktů z existujících faktur pro dropdown.
        """
        products = (
            Invoice.objects
                   .filter(hidden=False)
                   .values_list('product', flat=True)
                   .distinct()
                   .order_by('product')
        )
        return Response(list(products), status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def revenue_by_company(self, request):
        current_year = date.today().year
        years = [current_year - i for i in range(5)][::-1]

        companies = []
        persons = Person.objects.filter(hidden=False).order_by("name")
        for person in persons:
            total = Invoice.objects.filter(seller=person, hidden=False).aggregate(s=Sum("price"))["s"] or 0

            revenue_per_year = {}
            for y in years:
                rev = Invoice.objects.filter(
                    seller=person, hidden=False, issued__year=y
                ).aggregate(s=Sum("price"))["s"] or 0
                revenue_per_year[str(y)] = float(rev)

            companies.append({
                "personId": person.id,
                "personName": person.name,
                "revenue": float(total),
                "revenuePerYear": revenue_per_year,
            })

        return Response({"years": years, "companies": companies}, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.hidden = True
        instance.save(update_fields=["hidden"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"])
    def archived(self, request):
        archived_invoices = Invoice.objects.filter(hidden=True).order_by("id")
        return Response(self.get_serializer(archived_invoices, many=True).data)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        try:
            invoice = Invoice.objects.get(pk=pk, hidden=True)
        except Invoice.DoesNotExist:
            return Response({"detail": "Faktura nebyla nalezena v archivu."}, status=status.HTTP_404_NOT_FOUND)

        invoice.hidden = False
        invoice.save(update_fields=["hidden"])
        return Response(self.get_serializer(invoice).data)

    @action(detail=True, methods=["post"])
    def create_credit_note(self, request, pk=None):
        try:
            invoice = self.get_object()
            credit_note = Invoice.objects.create(
                invoiceNumber=f"{invoice.invoiceNumber}-CN",
                seller=invoice.seller,
                buyer=invoice.buyer,
                product=f"Dobropis k: {invoice.product}",
                price=-invoice.price,
                vat=invoice.vat,
                issued=timezone.now().date(),
                dueDate=timezone.now().date() + timezone.timedelta(days=14),
                note=f"Dobropis k faktuře č. {invoice.invoiceNumber}"
            )
            serializer = self.get_serializer(credit_note)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        original = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        new_invoice = Invoice.objects.create(**validated, hidden=False)
        return Response(self.get_serializer(new_invoice).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='products')
    def list_products(self, request):
        """
        GET /api/invoices/products/
        Vrátí seznam unikátních produktů z pole `product`.
        """
        products = (
            Invoice.objects
            .order_by('product')
            .values_list('product', flat=True)
            .distinct()
        )
        return Response(list(products))