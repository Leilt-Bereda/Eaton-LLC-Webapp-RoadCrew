// src/app/pages/open-pay-report/mock-pay-reports.ts
import { PayReport } from 'src/app/models/pay-report.model';

export const PAY_REPORTS_MOCK: Record<number, PayReport> = {
  1: {
    id: 1,
    driverId: 12,
    driverName: 'Mecarrthi',
    weekStart: '2025-08-04',
    weekEnd: '2025-08-10',

    // header rollups (can be recomputed in component if you prefer)
    totalWeightOrHours: 48,
    totalTruckPaid: 130 * 5,
    totalAmount: 6240,
    totalDue: 6240,

    fuelProgram: 0,
    fuelPilotOrKT: 0,
    fuelSurcharge: 0,

    lines: [
      {
        id: 101,
        date: '2025-08-04',
        truckNumber: 'M77',
        trailerNumber: '1635',
        jobNumber: '25332',
        loaded: 'Beach',
        unloaded: 'Maple St to Miller Exc',
        weightOrHour: 9.5,
        truckPaid: 130,
        total: 1235.0,
        trailerRent: 0,
        brokerCharge: 0,
        contractorPaid: 1235.0
      },
      {
        id: 102,
        date: '2025-08-05',
        truckNumber: 'M77',
        trailerNumber: '1635',
        jobNumber: '25332',
        loaded: 'Beach',
        unloaded: 'Maple St to Miller Exc',
        weightOrHour: 8.75,
        truckPaid: 130,
        total: 1137.5,
        trailerRent: 0,
        brokerCharge: 0,
        contractorPaid: 1137.5
      },
      {
        id: 103,
        date: '2025-08-06',
        truckNumber: 'M77',
        trailerNumber: '1635',
        jobNumber: '25-3270',
        loaded: 'Bolander',
        unloaded: 'Sterwertville to SKB',
        weightOrHour: 10.75,
        truckPaid: 130,
        total: 1397.5,
        trailerRent: 0,
        brokerCharge: 0,
        contractorPaid: 1397.5
      },
      {
        id: 104,
        date: '2025-08-07',
        truckNumber: 'M77',
        trailerNumber: '1635',
        jobNumber: '25-3270',
        loaded: 'Bolander',
        unloaded: 'Sterwertville to SKB',
        weightOrHour: 9.75,
        truckPaid: 130,
        total: 1267.5,
        trailerRent: 0,
        brokerCharge: 0,
        contractorPaid: 1267.5
      },
      {
        id: 105,
        date: '2025-08-08',
        truckNumber: 'M77',
        trailerNumber: '1635',
        jobNumber: '25-3270',
        loaded: 'Bolander',
        unloaded: 'Sterwertville to SKB',
        weightOrHour: 9.25,
        truckPaid: 130,
        total: 1202.5,
        trailerRent: 0,
        brokerCharge: 0,
        contractorPaid: 1202.5
      }
    ]
  }
};
