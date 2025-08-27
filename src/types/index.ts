import { z } from 'zod';

// Time management types for Japanese labor management system

export type WorkStatus = 'offline' | 'working' | 'break' | 'overtime';

export const EmployeeSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  role: z.string(),
  department: z.string(),
  hourlyWage: z.number().min(0),
  hireDate: z.string(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Employee = z.infer<typeof EmployeeSchema>;

export const TimeRecordSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  date: z.string(),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  breakStart: z.string().optional(),
  breakEnd: z.string().optional(),
  breakDuration: z.number().default(0), // minutes
  workingHours: z.number().default(0), // hours
  overtimeHours: z.number().default(0), // hours
  status: z.enum(['working', 'break', 'completed', 'pending_approval']),
  notes: z.string().optional(),
  approvedBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TimeRecord = z.infer<typeof TimeRecordSchema>;

export const ShiftSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  breakDuration: z.number().default(60), // minutes
  type: z.enum(['regular', 'overtime', 'holiday']),
  status: z.enum(['scheduled', 'confirmed', 'cancelled']),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Shift = z.infer<typeof ShiftSchema>;

export const WageRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['overtime', 'night', 'holiday']),
  rate: z.number(), // multiplier (e.g., 1.25 for 25% increase)
  baseRate: z.number(),
  overtimeRate: z.number(), // multiplier (e.g., 1.25 for 25% increase)
  nightRate: z.number(), // multiplier for night hours (22:00-5:00)
  holidayRate: z.number(), // multiplier for holidays
  nightStartHour: z.number().default(22),
  nightEndHour: z.number().default(5),
  roundingMinutes: z.number().default(15), // round to nearest X minutes
  isActive: z.boolean().default(true),
  conditions: z.record(z.string(), z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WageRule = z.infer<typeof WageRuleSchema>;

export const PayrollPeriodSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['draft', 'calculated', 'finalized', 'paid']),
  totalEmployees: z.number(),
  totalAmount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PayrollPeriod = z.infer<typeof PayrollPeriodSchema>;

export const PayrollRecordSchema = z.object({
  id: z.string(),
  periodId: z.string(),
  employeeId: z.string(),
  regularHours: z.number(),
  overtimeHours: z.number(),
  nightHours: z.number(),
  holidayHours: z.number(),
  regularPay: z.number(),
  overtimePay: z.number(),
  nightPay: z.number(),
  holidayPay: z.number(),
  totalPay: z.number(),
  deductions: z.number().default(0),
  netPay: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PayrollRecord = z.infer<typeof PayrollRecordSchema>;

// Dashboard summary types
export interface DashboardStats {
  totalEmployees: number;
  currentlyWorking: number;
  onBreak: number;
  totalHoursToday: number;
  pendingApprovals: number;
}

export interface WeeklyStats {
  date: string;
  hours: number;
  overtime: number;
}