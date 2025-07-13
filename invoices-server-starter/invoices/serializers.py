from rest_framework import serializers
from .models import Person
from .models import Invoice


class PersonSerializer(serializers.ModelSerializer):
    _id = serializers.IntegerField(source="id", read_only=True)
    identificationNumber = serializers.CharField(default=None)

    class Meta:
        model = Person
        fields = [
            'name', 'identificationNumber', 'taxNumber', 'accountNumber',
            'bankCode', 'iban', 'telephone', 'mail', 'street', 'zip',
            'city', 'country', 'note', '_id'
        ]

class InvoiceSerializer(serializers.ModelSerializer):
    _id = serializers.IntegerField(source="id", read_only=True)
    buyer = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all())
    seller = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all())

    class Meta:
        model = Invoice
        fields = [

            'invoiceNumber',
            'seller',
            'buyer',
            'issued',
            'dueDate',
            'product',
            'price',
            'vat',
            'note',
            '_id',


        ]

    def to_internal_value(self, data):
        if isinstance(data.get('seller'), dict) and '_id' in data['seller']:
            data['seller'] = data['seller']['_id']

        if isinstance(data.get('buyer'), dict) and '_id' in data['buyer']:
            data['buyer'] = data['buyer']['_id']

        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['seller'] = PersonSerializer(instance.seller).data
        data['buyer'] = PersonSerializer(instance.buyer).data
        return data

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        instance.invoiceNumber = validated_data.get("invoiceNumber", instance.invoiceNumber)
        instance.seller = validated_data.get("seller", instance.seller)
        instance.buyer = validated_data.get("buyer", instance.buyer)
        instance.issued = validated_data.get("issued", instance.issued)
        instance.dueDate = validated_data.get("dueDate", instance.dueDate)
        instance.product = validated_data.get("product", instance.product)
        instance.price = validated_data.get("price", instance.price)
        instance.vat = validated_data.get("vat", instance.vat)
        instance.note = validated_data.get("note", instance.note)
        instance.save()
        return instance


