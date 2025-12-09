import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DispatchDialogComponent } from './dispatch-dialog/dispatch-dialog.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';

type AssignmentRow = {
  id?: number;
  job: string;
  driver: string;
  truck_type: string;
  jobDate: string;
  time: string;
  selected?: boolean;
};

@Component({
  selector: 'app-dispatch',
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  providers: [DatePipe]
})
export class DispatchComponent implements OnInit {
  selectedDate: string; // Stores the selected date
  assignments: AssignmentRow[] = [
    { id: 1, job: 'HW72', driver: 'John Doe', truck_type: 'Semi', jobDate: '2025-03-13', time: '10:30', selected: false },
    { id: 2, job: 'I-32', driver: 'Jane Doe', truck_type: 'Belly Dump', jobDate: '2025-06-25', time: '14:00', selected: false },
    { id: 3, job: 'HW73', driver: 'Alice Smith', truck_type: 'Flatbed', jobDate: '2025-03-13', time: '10:30', selected: false }
  ];

  filteredAssignments: AssignmentRow[] = [];
  selected: AssignmentRow[] = [];

  constructor(
    private datePipe: DatePipe,
    public dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Initialize with the current date in 'yyyy-MM-dd' format
    this.selectedDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '';
  }

  ngOnInit(): void {
    // Check for date query parameter to restore previous selection
    this.route.queryParams.subscribe(params => {
      if (params['date']) {
        this.selectedDate = params['date'];
      }
      // Filter assignments by the selected date
      this.filteredAssignments = this.filterAssignmentsByDate(this.selectedDate);
    });
  }

  // Open the dispatch dialog
  openDialog(): void {
    this.dialog.open(DispatchDialogComponent, {
      width: '400px'
    });
  }

  // Toggle selection of all assignments
  toggleAllSelection(event: any) {
    const checked = event.target.checked;
    this.filteredAssignments.forEach(assignment => assignment.selected = checked);
    this.onSelect();
  }

  trackById = (_: number, r: AssignmentRow) => r.id || 0;

  onSelect(): void {
    this.selected = this.filteredAssignments.filter(r => !!r.selected);
  }

  // Format the job date for user-friendly display
  getFormattedDate(date: string): string {
    return this.datePipe.transform(date, 'MMMM d, yyyy') || '';
  }

  // Format the time in AM/PM format
  getFormattedTime(time: string): string {
    const hours = parseInt(time.split(':')[0], 10);
    const minutes = time.split(':')[1];
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 0 or 24 hour format to 12-hour format
    return `${formattedHours}:${minutes} ${period}`;
  }

  // Called when user changes the date input; updates the filtered list
  filterAssignments() {
    this.filteredAssignments = this.filterAssignmentsByDate(this.selectedDate);
    this.onSelect();
  }

  // Return only assignments matching the selected date (job date filter) - DO NOT TOUCH THIS
  filterAssignmentsByDate(date: string) {
    return this.assignments.filter(assignment => assignment.jobDate === date);
  }

  // View assignment
  view(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/dispatch/view', id], {
        queryParams: { date: this.selectedDate }
      });
    }
  }

  // Edit assignment
  edit(id: number | undefined): void {
    if (id) {
      this.router.navigate(['/dispatch/edit', id], {
        queryParams: { date: this.selectedDate }
      });
    }
  }

  // Delete single assignment
  delete(id: number | undefined): void {
    if (!id) return;
    
    if (!confirm('Are you sure you want to delete this dispatch assignment?')) return;
    
    // Remove from assignments array
    this.assignments = this.assignments.filter(a => a.id !== id);
    // Update filtered list
    this.filteredAssignments = this.filterAssignmentsByDate(this.selectedDate);
    this.onSelect();
  }

  // Bulk delete
  deleteSelected(): void {
    if (!this.selected.length) return;
    if (!confirm(`Are you sure you want to delete ${this.selected.length} selected assignment(s)?`)) return;
    
    const ids = this.selected.map(s => s.id).filter(id => id !== undefined) as number[];
    // Remove selected assignments
    this.assignments = this.assignments.filter(a => !ids.includes(a.id!));
    // Update filtered list
    this.filteredAssignments = this.filterAssignmentsByDate(this.selectedDate);
    this.selected = [];
    this.onSelect();
  }
}
