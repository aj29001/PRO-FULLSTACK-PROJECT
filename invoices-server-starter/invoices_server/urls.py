from django.contrib import admin
from django.urls import path, include

from invoices.routers import SlashOptionalRouter
from invoices.views.invoice_views import InvoiceViewSet
from invoices.views.person_views import PersonViewSet
from invoices.views.identification_views import IdentificationViewSet
from invoices.views.invoice_views import InvoiceViewSet




router = SlashOptionalRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoices')
router.register(r'persons', PersonViewSet, basename='persons')
router.register(r'identification', IdentificationViewSet, basename='identification')


invoice_restore = InvoiceViewSet.as_view({
    'post': 'restore'
})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path("invoices/<int:pk>/restore/", invoice_restore, name="invoice-restore"),
]
