import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DispatchDialogComponent } from './dispatch-dialog/dispatch-dialog.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dispatch',
  templateUrl: './dispatch.component.html',
  styleUrls: ['./dispatch.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe]
})
export class DispatchComponent {
  selectedDate: string;
  assignments = [
    { job: 'HW72', driver: 'John Doe', truck_type: 'Semi', jobDate: '2025-03-13', time: '10:30', selected: false },
    { job: 'I-32', driver: 'Jane Doe', truck_type: 'Belly Dump', jobDate: '2025-06-25', time: '14:00', selected: false },
    { job: 'HW73', driver: 'Alice Smith', truck_type: 'Flatbed', jobDate: '2025-03-13', time: '10:30', selected: false }
  ];

  filteredAssignments: any[] = [];

  constructor(private datePipe: DatePipe, public dialog: MatDialog) {
    this.selectedDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '';
    this.filteredAssignments = this.filterAssignmentsByDate(this.selectedDate);
  }

  openDialog(): void {
    this.dialog.open(DispatchDialogComponent, {
      width: '400px'
    });
  }

  toggleAllSelection(event: any) {
    const checked = event.target.checked;
    this.assignments.forEach(assignment => assignment.selected = checked);
  }

  getFormattedDate(date: string): string {
    return this.datePipe.transform(date, 'MMMM d, yyyy') || '';
  }

  getFormattedTime(time: string): string {
    const hours = parseInt(time.split(':')[0], 10);
    const minutes = time.split(':')[1];
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${period}`;
  }

  filterAssignments() {
    this.filteredAssignments = this.filterAssignmentsByDate(this.selectedDate);
  }

  filterAssignmentsByDate(date: string) {
    return this.assignments.filter(assignment => assignment.jobDate === date);
  }
}