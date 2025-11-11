from django.http import HttpResponse
from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.db.models import Q, Prefetch
from rest_framework.decorators import action
from django.utils.dateparse import parse_date
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone



from django.contrib.auth import get_user_model
from .models import (
    Job, Customer, Driver, Role, UserRole, Comment, Truck, DriverTruckAssignment, Operator, Address, JobDriverAssignment,Invoice, InvoiceLine,PayReport, PayReportLine
)
from .serializers import (
    JobSerializer, CustomerSerializer, DriverSerializer, RoleSerializer,
    UserSerializer, UserRoleSerializer, CommentSerializer, TruckSerializer,
    DriverTruckAssignmentSerializer, OperatorSerializer, AddressSerializer, JobDriverAssignmentSerializer,InvoiceSerializer, InvoiceLineSerializer, PayReportSerializer, PayReportLineSerializer
)

# For user model
User = get_user_model()

# Basic test view
def home(request):
    return HttpResponse("Hello, this is the home page!")


# ViewSets for basic CRUD APIs
class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    
class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    queryset = Job.objects.select_related(
        'prime_contractor_customer',
        'loading_address',
        'unloading_address',
        'backhaul_loading_address',
        'backhaul_unloading_address',
    )
   
    def get_queryset(self):
        qs = self.queryset
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(job_date=date)
        if customer_id:
            # Filter jobs by customer through invoices (since Invoice has both customer and job FKs)
            qs = qs.filter(invoices__customer_id=customer_id).distinct()
        if q:
            qs = qs.filter(
                models.Q(job_number__icontains=q) |
                models.Q(project__icontains=q) |
                models.Q(material__icontains=q)
            )
        return qs


    @action(detail=False, methods=['get'], url_path=r'by-number/(?P<job_number>[^/]+)')
    def by_number(self, request, job_number=None):
        job = self.get_queryset().filter(job_number=job_number).first()
        if not job:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(JobSerializer(job).data)

class JobDriverAssignmentViewSet(viewsets.ModelViewSet):
    queryset         = JobDriverAssignment.objects.select_related(
                         'job',
                         'driver_truck__driver',
                         'driver_truck__truck'
                       )
    serializer_class = JobDriverAssignmentSerializer
    
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('company_name')
    serializer_class = CustomerSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(company_name__icontains=q)
        return qs
class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer

class TruckViewSet(viewsets.ModelViewSet):
    queryset = Truck.objects.all()
    serializer_class = TruckSerializer

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class UserRoleViewSet(viewsets.ModelViewSet):
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

class DriverTruckAssignmentViewSet(viewsets.ModelViewSet):
    queryset = DriverTruckAssignment.objects.all()
    serializer_class = DriverTruckAssignmentSerializer

# Authentication views
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class OperatorViewSet(viewsets.ModelViewSet):
    queryset = Operator.objects.all()
    serializer_class = OperatorSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    pass

class CustomTokenRefreshView(TokenRefreshView):
    pass
# views.py
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Prefetch

from .models import PayReport, PayReportLine, Job
from .serializers import (
    PayReportListSerializer, PayReportCreateSerializer, PayReportDetailSerializer, PayReportUpdateSerializer,
    PayReportLineReadSerializer, PayReportLineWriteSerializer,
    JobSerializer,  # you already have this
)

class PayReportViewSet(viewsets.ModelViewSet):
    """
    /api/pay-reports
      - GET    (list headers, with filters)
      - POST   (create header)
    /api/pay-reports/{id}
      - GET    (detail with lines)
      - PATCH  (update header)
      - DELETE (delete header + lines)
    Custom:
    /api/pay-reports/{id}/lines          [POST]   create a line
    /api/pay-reports/{id}/lines/{lineId} [PATCH]  update one line
    /api/pay-reports/{id}/lines/{lineId} [DELETE] delete one line
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = PayReport.objects.select_related('driver').prefetch_related('lines')

    def get_queryset(self):
        qs = super().get_queryset()
        driver = self.request.query_params.get('driver')  # id
        date_from = self.request.query_params.get('from')
        date_to   = self.request.query_params.get('to')

        if driver:
            qs = qs.filter(driver_id=driver)
        if date_from:
            qs = qs.filter(week_end__gte=date_from)
        if date_to:
            qs = qs.filter(week_start__lte=date_to)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return PayReportListSerializer
        if self.action == 'retrieve':
            return PayReportDetailSerializer
        if self.action == 'create':
            return PayReportCreateSerializer
        if self.action in ['partial_update', 'update']:
            return PayReportUpdateSerializer
        return PayReportListSerializer

    # ----- Lines: create -----
    @action(detail=True, methods=['post'], url_path='lines')
    def create_line(self, request, pk=None):
        report = self.get_object()
        ser = PayReportLineWriteSerializer(data=request.data, context={'report': report})
        ser.is_valid(raise_exception=True)
        line = ser.save()
        return Response(PayReportLineReadSerializer(line).data, status=status.HTTP_201_CREATED)

    # ----- Lines: update -----
    @action(detail=True, methods=['patch'], url_path=r'lines/(?P<line_id>[^/.]+)')
    def update_line(self, request, pk=None, line_id=None):
        report = self.get_object()
        try:
            line = report.lines.get(pk=line_id)
        except PayReportLine.DoesNotExist:
            return Response({'detail': 'Line not found.'}, status=status.HTTP_404_NOT_FOUND)

        ser = PayReportLineWriteSerializer(line, data=request.data, partial=True, context={'report': report})
        ser.is_valid(raise_exception=True)
        line = ser.save()
        return Response(PayReportLineReadSerializer(line).data)

    # ----- Lines: delete -----
    @action(detail=True, methods=['delete'], url_path=r'lines/(?P<line_id>[^/.]+)')
    def delete_line(self, request, pk=None, line_id=None):
        report = self.get_object()
        deleted, _ = report.lines.filter(pk=line_id).delete()
        if not deleted:
            return Response({'detail': 'Line not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PayReportLineViewSet(viewsets.ModelViewSet):
    """
    Top-level CRUD for pay report lines:
      GET    /api/pay-report-lines?report={id}
      POST   /api/pay-report-lines
      GET    /api/pay-report-lines/{id}
      PATCH  /api/pay-report-lines/{id}
      DELETE /api/pay-report-lines/{id}
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = PayReportLine.objects.select_related('report').all()

    def get_queryset(self):
        qs = super().get_queryset()
        report_id = self.request.query_params.get('report')
        if report_id:
            qs = qs.filter(report_id=report_id)
        return qs

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PayReportLineWriteSerializer
        return PayReportLineReadSerializer

# Protected test endpoint
@api_view(["GET"])
def protected_view(request):
    return Response({"message": "This is a protected view!"}, status=status.HTTP_200_OK)

# API: Assign a truck to a driver
@api_view(["POST"])
def assign_truck_to_driver(request):
    driver_id = request.data.get('driver_id')
    truck_id = request.data.get('truck_id')

    if not driver_id or not truck_id:
        return Response({'error': 'driver_id and truck_id are required.'}, status=400)

    try:
        driver = Driver.objects.get(id=driver_id)
        truck = Truck.objects.get(id=truck_id)
        assignment = DriverTruckAssignment.objects.create(driver=driver, truck=truck)
        return Response({'message': 'Truck assigned to driver successfully.'})
    except Driver.DoesNotExist:
        return Response({'error': 'Driver not found.'}, status=404)
    except Truck.DoesNotExist:
        return Response({'error': 'Truck not found.'}, status=404)

# API: Show all drivers and trucks
@api_view(["GET"])
def drivers_and_trucks(request):
    drivers = Driver.objects.all()
    trucks = Truck.objects.all()
    driver_data = DriverSerializer(drivers, many=True).data
    truck_data = TruckSerializer(trucks, many=True).data
    return Response({
        "drivers": driver_data,
        "trucks": truck_data
    })

@api_view(['GET'])
def unassigned_trucks(request):
    # Get only truck IDs that are currently assigned (not unassigned yet)
    assigned_truck_ids = DriverTruckAssignment.objects.filter(unassigned_at__isnull=True).values_list('truck_id', flat=True)
    
    # Exclude those from available trucks
    unassigned = Truck.objects.exclude(id__in=assigned_truck_ids)
    
    serializer = TruckSerializer(unassigned, many=True)
    return Response(serializer.data)
class InvoiceViewSet(viewsets.ModelViewSet):
    """
    Endpoints:
      GET    /api/invoices/
      POST   /api/invoices/
      GET    /api/invoices/{id}/
      PATCH  /api/invoices/{id}/
      DELETE /api/invoices/{id}/
    Filters (query params): customer, project, status, date
    """
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        qs = (Invoice.objects
              .select_related("customer", "job")
              .prefetch_related(Prefetch("lines", queryset=InvoiceLine.objects.all()))
              .order_by("-id"))

        customer = self.request.query_params.get("customer")
        project  = self.request.query_params.get("project")
        status_  = self.request.query_params.get("status")
        date     = self.request.query_params.get("date")

        if customer:
            qs = qs.filter(customer__company_name__icontains=customer)
        if project:
            # adjust if your job/project field is named differently
            qs = qs.filter(job__project__icontains=project)
        if status_:
            qs = qs.filter(status=status_)
        if date:
            qs = qs.filter(invoice_date=date)
        return qs


class InvoiceLineViewSet(viewsets.ModelViewSet):
    """
    Optional: expose line-level CRUD (useful for editing lines later)
    """
    queryset = InvoiceLine.objects.select_related("invoice").all()
    serializer_class = InvoiceLineSerializer
class PayReportViewSet(viewsets.ModelViewSet):
    """
    Uses Supabase tables:
      - myapp_payreport (header)
      - myapp_payreportline (details)
    """
    queryset = PayReport.objects.select_related('driver').prefetch_related('lines')
    serializer_class = PayReportSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        driver_id = self.request.query_params.get('driver_id')
        start     = self.request.query_params.get('start')
        end       = self.request.query_params.get('end')
        if driver_id:
            qs = qs.filter(driver_id=driver_id)
        if start:
            qs = qs.filter(week_end__gte=start)
        if end:
            qs = qs.filter(week_start__lte=end)
        return qs

    def perform_create(self, serializer):
        pr = serializer.save(created_at=timezone.now(), updated_at=timezone.now())
        pr.recalc_from_lines()

    def perform_update(self, serializer):
        pr = serializer.save(updated_at=timezone.now())
        pr.recalc_from_lines()

    @action(detail=False, methods=['post'], url_path='generate')
    def generate(self, request):
        """
        Body:
        {
          "driver_id": 3,
          "week_start": "2025-08-04",
          "week_end":   "2025-08-10"
        }
        Creates header + daily lines (hours start at 0).
        """
        driver_id = request.data.get('driver_id')
        ws = parse_date(request.data.get('week_start'))
        we = parse_date(request.data.get('week_end'))

        if not (driver_id and ws and we and we >= ws):
            return Response(
                {"detail": "driver_id, week_start, week_end required (week_end >= week_start)."},
                status=status.HTTP_400_BAD_REQUEST
            )
        exists = PayReport.objects.filter(driver_id=driver_id, week_start=ws, week_end=we).exists()
        if exists:
            return Response(
                {"detail": "Report already exists for this driver/week."},
                status=status.HTTP_409_CONFLICT  # same as 409
            )

        pr = PayReport.objects.create(
            driver_id=driver_id,
            week_start=ws, week_end=we,
            fuel_program=Decimal('0.00'),
            fuel_pilot_or_kt=Decimal('0.00'),
            fuel_surcharge=Decimal('0.00'),
            total_weight_or_hours=Decimal('0.00'),
            total_truck_paid=Decimal('0.00'),
            total_amount=Decimal('0.00'),
            total_due=Decimal('0.00'),
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )

        # Active driver assignments overlapping the week
        assignments = JobDriverAssignment.objects.select_related(
            'job',
            'driver_truck__driver',
            'driver_truck__truck',
            'job__loading_address',
            'job__unloading_address'
        ).filter(
            driver_truck__driver_id=driver_id,
            assigned_at__date__lte=we
        ).filter(
            Q(unassigned_at__isnull=True) | Q(unassigned_at__date__gte=ws)
        )

        # Seed one line per day per assignment
        day = ws
        while day <= we:
            for a in assignments:
                PayReportLine.objects.create(
                    report=pr,
                    job=a.job,
                    date=day,
                    job_number=a.job.job_number,
                    truck_number=a.driver_truck.truck.truck_number,
                    trailer_number='',
                    loaded=(a.job.loading_address.location_name or str(a.job.loading_address)) if a.job.loading_address else '',
                    unloaded=(a.job.unloading_address.location_name or str(a.job.unloading_address)) if a.job.unloading_address else '',
                    weight_or_hour=Decimal('0.00'),
                    truck_paid=(getattr(a, 'rate', None) or Decimal('0.00')),
                    total=Decimal('0.00'),
                    trailer_rent=Decimal('0.00'),
                    broker_charge=Decimal('0.00'),
                    contractor_paid=Decimal('0.00'),
                    created_at=timezone.now(),
                )
            day += timedelta(days=1)

        pr.recalc_from_lines()
        return Response(self.get_serializer(pr).data, status=status.HTTP_201_CREATED)


class PayReportLineViewSet(viewsets.ModelViewSet):
    queryset = PayReportLine.objects.select_related('report', 'job')
    serializer_class = PayReportLineSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        report_id = self.request.query_params.get('report_id')
        job_id    = self.request.query_params.get('job_id')
        if report_id:
            qs = qs.filter(report_id=report_id)
        if job_id:
            qs = qs.filter(job_id=job_id)
        return qs

    def perform_update(self, serializer):
        line = serializer.save()  # model.save() recomputes totals
        line.report.recalc_from_lines()


from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import RequestOTPSerializer, VerifyOTPSerializer, ResetPasswordSerializer
from .models import PasswordOTP
from .emails import send_password_otp_email
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def _recent_otp_count(user, minutes=15):
    since = timezone.now() - timedelta(minutes=minutes)
    return PasswordOTP.objects.filter(user=user, created_at__gte=since, purpose="password_reset").count()

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["post"], url_path="password-reset")
    def request_password_otp(self, request):
        s = RequestOTPSerializer(data=request.data); s.is_valid(raise_exception=True)
        email = s.validated_data["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()
        if user and _recent_otp_count(user) < 3:
            PasswordOTP.objects.filter(user=user, used=False, purpose="password_reset").update(used=True)
            otp, code = PasswordOTP.create_for_user(user, ttl_minutes=10)
            email_sent = send_password_otp_email(email, code, minutes=10)
            if not email_sent:
                return Response({"error": "Failed to send email. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        # Always return success to prevent email enumeration
        return Response({"ok": True, "message": "If an account exists with this email, a password reset code has been sent."})

    @action(detail=False, methods=["post"], url_path="password-reset/verify")
    def verify_password_otp(self, request):
        s = VerifyOTPSerializer(data=request.data); s.is_valid(raise_exception=True)
        email, code = s.validated_data["email"].lower(), s.validated_data["code"]
        user = User.objects.filter(email__iexact=email).first()
        if not user: return Response({"valid": False})
        otp = (PasswordOTP.objects
               .filter(user=user, purpose="password_reset", used=False)
               .order_by("-created_at").first())
        if otp and otp.verify(code): return Response({"valid": True})
        return Response({"valid": False})

    @action(detail=False, methods=["post"], url_path="password-reset/confirm")
    def reset_password_with_otp(self, request):
        s = ResetPasswordSerializer(data=request.data); s.is_valid(raise_exception=True)
        email, code, new_pw = s.validated_data["email"].lower(), s.validated_data["code"], s.validated_data["new_password"]
        user = User.objects.filter(email__iexact=email).first()
        if not user: return Response({"ok": True})
        otp = (PasswordOTP.objects
               .filter(user=user, purpose="password_reset", used=False)
               .order_by("-created_at").first())
        if not (otp and otp.verify(code)):
            from rest_framework import status
            return Response({"detail": "Invalid or expired code."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_pw); user.save(update_fields=["password"])
        return Response({"ok": True})
