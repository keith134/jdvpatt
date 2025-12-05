export enum AttendanceStatus {
  PRESENT = 'P',
  ABSENT = 'A',
  LATE = 'L',
  EXCUSED = 'E',
  NONE = '-'
}

export interface Student {
  id: string;
  name: string;
  schoolId: string;
  strand: string;
}

export interface AttendanceRecord {
  [day: number]: AttendanceStatus;
}

export interface AttendanceState {
  [studentId: string]: AttendanceRecord;
}

export interface AppData {
  students: Student[];
  attendance: AttendanceState;
  trainingTitle: string;
  startDate: string;
}

export const TOTAL_DAYS = 40;
