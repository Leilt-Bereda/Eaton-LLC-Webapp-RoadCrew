from rest_framework import serializers
from .models import Job, Customer, Driver, Role, User, UserRole, Comment, Truck, DriverTruckAssignment, Operator, Address, JobDriverAssignment,Invoice,InvoiceLine
from django.contrib.auth import get_user_model

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'

class DriverTruckAssignmentSerializer(serializers.ModelSerializer):
    driver = serializers.StringRelatedField()
    truck_type = serializers.CharField(
                     source='truck.truck_type',
                     read_only=True
                 )
    driver_phone = serializers.CharField(
        source='driver.phone_number',
        read_only=True
    )
    
    class Meta:
        model  = DriverTruckAssignment
        fields = ['id', 'driver', 'truck_type', 'driver_phone', 'assigned_at', 'unassigned_at']

class JobDriverAssignmentSerializer(serializers.ModelSerializer):
    # writable foreign key
    driver_truck = serializers.PrimaryKeyRelatedField(
        queryset=DriverTruckAssignment.objects.all()
    )
    # nested info for GETs
    driver_truck_info = DriverTruckAssignmentSerializer(
        source='driver_truck',
        read_only=True
    )

    class Meta:
        model  = JobDriverAssignment
        fields = [
            'id',
            'job',
            'driver_truck',       # POST this
            'driver_truck_info',  # GET this
            'assigned_at',
            'unassigned_at',
        ]
        read_only_fields = ['assigned_at', 'unassigned_at']
        
class JobSerializer(serializers.ModelSerializer):
    # Writeable FK fields:
    loading_address           = serializers.PrimaryKeyRelatedField(
                                    queryset=Address.objects.all()
                                )
    unloading_address         = serializers.PrimaryKeyRelatedField(
                                    queryset=Address.objects.all()
                                )
    backhaul_loading_address   = serializers.PrimaryKeyRelatedField(
                                    queryset=Address.objects.all(),
                                    required=False,
                                    allow_null=True
                                )
    backhaul_unloading_address = serializers.PrimaryKeyRelatedField(
                                    queryset=Address.objects.all(),
                                    required=False,
                                    allow_null=True
                                )

    # Nested read-only info for GET responses:
    loading_address_info           = AddressSerializer(source='loading_address', read_only=True)
    unloading_address_info         = AddressSerializer(source='unloading_address', read_only=True)
    backhaul_loading_address_info   = AddressSerializer(source='backhaul_loading_address', read_only=True)
    backhaul_unloading_address_info = AddressSerializer(source='backhaul_unloading_address', read_only=True)
    driver_assignments = JobDriverAssignmentSerializer(
      many=True,
      read_only=True
    )

    class Meta:
        model = Job
        fields = [
            'id',
            'project',
            'prime_contractor',
            'prime_contractor_project_number',
            'contractor_invoice',
            'new_contractor_invoice',
            'contractor_invoice_project_number',
            'new_contractor_invoice_project_number',
            'prevailing_or_not',
            'sap_or_sp_number',
            'report_requirement',
            'contract_number',
            'prevailing_wage_class_codes',
            'project_id',
            'job_description',
            'job_number',
            'material',
            'truck_types',
            'job_date',
            'shift_start',
            # writeable PKs
            'loading_address',
            'unloading_address',
            'backhaul_loading_address',
            'backhaul_unloading_address',
            # nested info
            'loading_address_info',
            'unloading_address_info',
            'backhaul_loading_address_info',
            'backhaul_unloading_address_info',
            'is_backhaul_enabled',
            'job_foreman_name',
            'job_foreman_contact',
            'additional_notes',
            'driver_assignments',
            'created_at',
        ]
        read_only_fields = ['created_at']

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']  # Include any other fields you need
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password) 
        user.save()
        return user

class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = '__all__'

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = '__all__'

class TruckSerializer(serializers.ModelSerializer):
    class Meta:
        model = Truck
        fields = '__all__'


        
class OperatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Operator
        fields = '__all__'


class InvoiceLineSerializer(serializers.ModelSerializer):
    # If your model does NOT store `amount`, compute it from qty * unit_price:
    amount = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = InvoiceLine
        fields = ["id", "invoice", "description", "quantity", "unit_price", "amount"]
        read_only_fields = ["id"]

    def get_amount(self, obj):
        # If your model already has `amount` field, replace with: return obj.amount
        qty = obj.quantity or 0
        price = obj.unit_price or 0
        return float(qty) * float(price)


class InvoiceSerializer(serializers.ModelSerializer):
    customer_id = serializers.IntegerField()
    job_id = serializers.IntegerField( allow_null=True, required=False)
    lines = InvoiceLineSerializer(many=True, required=False)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_no",
            "invoice_date",
            "status",
            "total_amount",     # keep read-only if you compute it server-side
            "customer_id",
            "job_id",
            "lines",
        ]
        read_only_fields = ["id", "total_amount"]

    def create(self, validated_data):
        # pop nested lines (coming from `source="lines"`)
        lines_data = validated_data.pop("lines", [])
        invoice = Invoice.objects.create(**validated_data)

        for line in lines_data:
            InvoiceLine.objects.create(invoice=invoice, **line)

        # Optional: compute total here if not handled by model .save()
        try:
            total = 0
            for l in invoice.lines.all():
                qty = l.quantity or 0
                price = l.unit_price or 0
                total += float(qty) * float(price)
            invoice.total_amount = total
            invoice.save(update_fields=["total_amount"])
        except Exception:
            pass

        return invoice

    def update(self, instance, validated_data):
        # Header-only updates (keep line editing for later)
        validated_data.pop("lines", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance
class PayReportLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayReportLine
        fields = [
            'id', 'report', 'job', 'date',
            'job_number', 'truck_number', 'trailer_number',
            'loaded', 'unloaded',
            'weight_or_hour', 'truck_paid',
            'total', 'contractor_paid',
            'trailer_rent', 'broker_charge',
            'created_at',
        ]
        read_only_fields = ['id', 'total', 'contractor_paid', 'created_at']

class PayReportSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.name', read_only=True)
    lines = PayReportLineSerializer(many=True, read_only=True)

    class Meta:
        model = PayReport
        fields = [
            'id', 'driver', 'driver_name',
            'week_start', 'week_end',
            'fuel_program', 'fuel_pilot_or_kt', 'fuel_surcharge',
            'total_weight_or_hours', 'total_truck_paid', 'total_amount', 'total_due',
            'created_at', 'updated_at',
            'lines',
        ]
        read_only_fields = [
            'id',
            'total_weight_or_hours', 'total_truck_paid', 'total_amount', 'total_due',
            'created_at', 'updated_at',
        ]
    def validate(self, attrs):
            ws = attrs.get('week_start', getattr(self.instance, 'week_start', None))
            we = attrs.get('week_end',   getattr(self.instance, 'week_end',   None))
            if ws and we and we < ws:
                raise serializers.ValidationError({"week_end": "must be on/after week_start"})
            return attrs
