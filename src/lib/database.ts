import { Employee, TimeRecord, Shift, WageRule, PayrollPeriod, PayrollRecord } from '@/types';
import dayjs from '@/utils/dayjs';

// SQLite-like storage simulation for the web version
class LocalDatabase {
  private employees: Employee[] = [];
  private timeRecords: TimeRecord[] = [];
  private shifts: Shift[] = [];
  private wageRules: WageRule[] = [];
  private payrollPeriods: PayrollPeriod[] = [];
  private payrollRecords: PayrollRecord[] = [];

  private generateId(): string {
    return crypto.randomUUID();
  }

  // Initialize with sample data
  initialize(): void {
    if (this.employees.length === 0) {
      this.createSampleData();
    }
  }

  private createSampleData(): void {
    // Create sample employees
    const sampleEmployees: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        code: 'EMP001',
        name: '田中 太郎',
        email: 'tanaka@example.com',
        role: '店長',
        department: '販売部',
        hourlyWage: 1200,
        hireDate: '2023-01-15',
        status: 'active'
      },
      {
        code: 'EMP002',
        name: '佐藤 花子',
        email: 'sato@example.com',
        role: 'アルバイト',
        department: '販売部',
        hourlyWage: 1000,
        hireDate: '2023-03-01',
        status: 'active'
      },
      {
        code: 'EMP003',
        name: '鈴木 次郎',
        email: 'suzuki@example.com',
        role: 'パート',
        department: '販売部',
        hourlyWage: 950,
        hireDate: '2023-06-01',
        status: 'active'
      }
    ];

    sampleEmployees.forEach(emp => this.createEmployee(emp));

    // Create sample wage rule
    this.createWageRule({
      name: '基本賃金規則',
      baseRate: 1000,
      overtimeRate: 1.25,
      nightRate: 1.25,
      holidayRate: 1.35,
      nightStartHour: 22,
      nightEndHour: 5,
      roundingMinutes: 15,
      isActive: true
    });
  }

  // Employee operations
  createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
    const now = dayjs().toISOString();
    const employee: Employee = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };
    this.employees.push(employee);
    this.saveToStorage();
    return employee;
  }

  getEmployees(): Employee[] {
    return [...this.employees];
  }

  getEmployee(id: string): Employee | undefined {
    return this.employees.find(emp => emp.id === id);
  }

  updateEmployee(id: string, updates: Partial<Employee>): Employee | undefined {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index === -1) return undefined;

    const updatedEmployee = {
      ...this.employees[index],
      ...updates,
      updatedAt: dayjs().toISOString()
    };
    this.employees[index] = updatedEmployee;
    this.saveToStorage();
    return updatedEmployee;
  }

  deleteEmployee(id: string): boolean {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index === -1) return false;

    this.employees.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Time Record operations
  createTimeRecord(data: Omit<TimeRecord, 'id' | 'createdAt' | 'updatedAt'>): TimeRecord {
    const now = dayjs().toISOString();
    const record: TimeRecord = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };
    this.timeRecords.push(record);
    this.saveToStorage();
    return record;
  }

  getTimeRecords(employeeId?: string, startDate?: string, endDate?: string): TimeRecord[] {
    let records = [...this.timeRecords];

    if (employeeId) {
      records = records.filter(record => record.employeeId === employeeId);
    }

    if (startDate && endDate) {
      records = records.filter(record => 
        record.date >= startDate && record.date <= endDate
      );
    }

    return records.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
  }

  updateTimeRecord(id: string, updates: Partial<TimeRecord>): TimeRecord | undefined {
    const index = this.timeRecords.findIndex(record => record.id === id);
    if (index === -1) return undefined;

    const updatedRecord = {
      ...this.timeRecords[index],
      ...updates,
      updatedAt: dayjs().toISOString()
    };
    this.timeRecords[index] = updatedRecord;
    this.saveToStorage();
    return updatedRecord;
  }

  // Shift operations
  createShift(data: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Shift {
    const now = dayjs().toISOString();
    const shift: Shift = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };
    this.shifts.push(shift);
    this.saveToStorage();
    return shift;
  }

  getShifts(employeeId?: string, startDate?: string, endDate?: string): Shift[] {
    let shifts = [...this.shifts];

    if (employeeId) {
      shifts = shifts.filter(shift => shift.employeeId === employeeId);
    }

    if (startDate && endDate) {
      shifts = shifts.filter(shift => 
        shift.date >= startDate && shift.date <= endDate
      );
    }

    return shifts.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
  }

  // Wage Rule operations
  createWageRule(data: Omit<WageRule, 'id' | 'createdAt' | 'updatedAt'>): WageRule {
    const now = dayjs().toISOString();
    const rule: WageRule = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };
    this.wageRules.push(rule);
    this.saveToStorage();
    return rule;
  }

  getWageRules(): WageRule[] {
    return [...this.wageRules];
  }

  getActiveWageRule(): WageRule | undefined {
    return this.wageRules.find(rule => rule.isActive);
  }

  // Storage operations
  private saveToStorage(): void {
    const data = {
      employees: this.employees,
      timeRecords: this.timeRecords,
      shifts: this.shifts,
      wageRules: this.wageRules,
      payrollPeriods: this.payrollPeriods,
      payrollRecords: this.payrollRecords
    };
    localStorage.setItem('time-management-data', JSON.stringify(data));
  }

  loadFromStorage(): void {
    const data = localStorage.getItem('time-management-data');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.employees = parsed.employees || [];
        this.timeRecords = parsed.timeRecords || [];
        this.shifts = parsed.shifts || [];
        this.wageRules = parsed.wageRules || [];
        this.payrollPeriods = parsed.payrollPeriods || [];
        this.payrollRecords = parsed.payrollRecords || [];
      } catch (error) {
        console.error('Failed to load data from storage:', error);
      }
    }
  }

  // Get dashboard statistics
  getDashboardStats() {
    const today = dayjs().format('YYYY-MM-DD');
    const todayRecords = this.timeRecords.filter(record => record.date === today);
    
    return {
      totalEmployees: this.employees.filter(emp => emp.status === 'active').length,
      currentlyWorking: todayRecords.filter(record => record.status === 'working').length,
      onBreak: todayRecords.filter(record => record.status === 'break').length,
      totalHoursToday: todayRecords.reduce((sum, record) => sum + record.workingHours, 0),
      pendingApprovals: todayRecords.filter(record => record.status === 'pending_approval').length
    };
  }
}

// Export singleton instance
export const database = new LocalDatabase();