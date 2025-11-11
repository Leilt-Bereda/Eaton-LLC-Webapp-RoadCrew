from rest_framework import serializers
from .models import Job, Customer, Driver, Role, User, UserRole, Comment, Truck, DriverTruckAssignment, Operator, Address, JobDriverAssignment, PayReport, PayReportLine, Job, Driver
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

# ---------- Lines ----------
class PayReportLineReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayReportLine
        fields = [
            'id', 'date', 'job', 'job_number',
            'truck_number', 'trailer_number',
            'loaded', 'unloaded',
            'weight_or_hour',
            'truck_paid', 'total',
            'trailer_rent', 'broker_charge', 'contractor_paid',
            'created_at',
        ]
        read_only_fields = fields


class PayReportLineWriteSerializer(serializers.ModelSerializer):
    """
    Create/Update serializer for a line.
    - job_number is required
    - job FK is optional; we attempt to resolve it by job_number (lenient)
    - date must be within the parent report week (validated in validate())
    """
    job_number = serializers.CharField()

    class Meta:
        model = PayReportLine
        fields = [
            'id', 'date', 'job_number',
            'truck_number', 'trailer_number',
            'loaded', 'unloaded',
            'weight_or_hour',
            'truck_paid', 'total',
            'trailer_rent', 'broker_charge', 'contractor_paid',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        report: PayReport = self.context['report']  # provided by the ViewSet action
        date = attrs.get('date')
        if date and (date < report.week_start or date > report.week_end):
            raise serializers.ValidationError({'date': 'Date must be within the report week.'})
        return attrs

    def _resolve_job(self, job_number: str):
        if not job_number:
            return None
        # lenient: first match; if you enforce uniqueness, switch to get()
        return Job.objects.filter(job_number=job_number).first()

    def create(self, validated):
        report: PayReport = self.context['report']
        job_number = validated.get('job_number', '').strip()
        instance = PayReportLine.objects.create(
            report=report,
            job=self._resolve_job(job_number),
            **validated
        )
        return instance

    def update(self, instance, validated):
        # if job_number provided, try to re-resolve the FK
        if 'job_number' in validated:
            job_number = (validated.get('job_number') or '').strip()
            instance.job = self._resolve_job(job_number)
        return super().update(instance, validated)


# ---------- Reports (headers) ----------
class PayReportListSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.name', read_only=True)

    class Meta:
        model = PayReport
        fields = [
            'id', 'week_start', 'week_end',
            'driver', 'driver_name',
            'total_weight_or_hours', 'total_truck_paid',
            'total_amount', 'total_due',
            'fuel_program', 'fuel_pilot_or_kt', 'fuel_surcharge',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'total_weight_or_hours', 'total_truck_paid',
            'total_amount', 'total_due',
            'created_at', 'updated_at'
        ]


class PayReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayReport
        fields = [
            'id', 'driver', 'week_start', 'week_end',
            'fuel_program', 'fuel_pilot_or_kt', 'fuel_surcharge',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        if attrs['week_start'] > attrs['week_end']:
            raise serializers.ValidationError({'week_end': 'End date must be on or after start date.'})
        return attrs

    def create(self, validated):
        # Optionally copy driver name snapshot here if you add such a field later
        return super().create(validated)


class PayReportUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayReport
        fields = [
            'week_start', 'week_end',
            'driver',
            'fuel_program', 'fuel_pilot_or_kt', 'fuel_surcharge',
        ]

    def validate(self, attrs):
        # only validate dates if both provided in PATCH
        start = attrs.get('week_start', getattr(self.instance, 'week_start', None))
        end   = attrs.get('week_end',   getattr(self.instance, 'week_end', None))
        if start and end and start > end:
            raise serializers.ValidationError({'week_end': 'End date must be on or after start date.'})
        return attrs


class PayReportDetailSerializer(PayReportListSerializer):
    lines = PayReportLineReadSerializer(many=True, read_only=True)

    class Meta(PayReportListSerializer.Meta):
        fields = PayReportListSerializer.Meta.fields + ['lines']

class RequestOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(r"^\d{6}$")

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(r"^\d{6}$")
    new_password = serializers.CharField(min_length=8, write_only=True)




