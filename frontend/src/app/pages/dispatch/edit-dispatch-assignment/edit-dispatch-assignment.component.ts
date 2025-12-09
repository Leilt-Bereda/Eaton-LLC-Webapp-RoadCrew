import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';

type AssignmentData = {
  id?: number;
  job: string;
  driver: string;
  truck_type: string;
  jobDate: string;
  time: string;
};

@Component({
  selector: 'app-edit-dispatch-assignment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './edit-dispatch-assignment.component.html',
  styleUrl: './edit-dispatch-assignment.component.scss'
})
export class EditDispatchAssignmentComponent implements OnInit {
  assignmentId: number | null = null;
  assignmentForm = new FormGroup({
    job: new FormControl('', Validators.required),
    driver: new FormControl('', Validators.required),
    truck_type: new FormControl('', Validators.required),
    jobDate: new FormControl('', Validators.required),
    time: new FormControl('', Validators.required),
  });
  loading = false;
  error: string | null = null;

  // Hardcoded assignments data (same as dispatch component)
  private assignmentsData: AssignmentData[] = [
    { id: 1, job: 'HW72', driver: 'John Doe', truck_type: 'Semi', jobDate: '2025-03-13', time: '10:30' },
    { id: 2, job: 'I-32', driver: 'Jane Doe', truck_type: 'Belly Dump', jobDate: '2025-06-25', time: '14:00' },
    { id: 3, job: 'HW73', driver: 'Alice Smith', truck_type: 'Flatbed', jobDate: '2025-03-13', time: '10:30' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.assignmentId = idParam ? +idParam : null;
    
    if (this.assignmentId) {
      this.loadAssignment(this.assignmentId);
    } else {
      this.router.navigate(['/dispatch']);
    }
  }

  loadAssignment(id: number): void {
    this.loading = true;
    this.error = null;
    
    const found = this.assignmentsData.find(a => a.id === id);
    if (found) {
      // Convert time from "10:30" format to "HH:mm" for time input
      const timeParts = found.time.split(':');
      const timeForInput = `${timeParts[0]}:${timeParts[1]}`;
      
      this.assignmentForm.patchValue({
        job: found.job,
        driver: found.driver,
        truck_type: found.truck_type,
        jobDate: found.jobDate,
        time: timeForInput,
      });
    } else {
      this.error = 'Assignment not found.';
      setTimeout(() => {
        this.router.navigate(['/dispatch']);
      }, 2000);
    }
    this.loading = false;
  }

  submitForm(): void {
    if (this.assignmentForm.invalid || !this.assignmentId) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    // In a real app, you would call the API here
    // For now, we'll just show a success message
    Swal.fire({
      icon: 'success',
      title: 'Assignment Updated',
      text: 'Assignment has been successfully updated 🎉',
      toast: true,
      position: 'bottom-end',
      timer: 3000,
      showConfirmButton: false
    });

    // Get the date from query params to preserve it
    const date = this.route.snapshot.queryParams['date'];
    if (date) {
      this.router.navigate(['/dispatch'], { queryParams: { date } });
    } else {
      this.router.navigate(['/dispatch']);
    }
  }

  goBack(): void {
    // Get the date from query params to preserve it
    const date = this.route.snapshot.queryParams['date'];
    if (date) {
      this.router.navigate(['/dispatch'], { queryParams: { date } });
    } else {
      this.router.navigate(['/dispatch']);
    }
  }
}

