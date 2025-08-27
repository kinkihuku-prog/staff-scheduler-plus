// Database simulation for the web version
// In the Tauri version, this will be replaced with actual SQLite operations

import { Employee, TimeRecord, Shift, WageRule, PayrollPeriod } from '@/types';

// Mock data storage (in-memory for demo)
let employees: Employee[] = [];
let timeRecords: TimeRecord[] = [];
let shifts: Shift[] = [];
let wageRules: WageRule[] = [];
let payrollPeriods: PayrollPeriod[] = [];

// Initialize with sample data
export const initializeDatabase = () => {
  console.log('Initializing database with sample data...');
  
  // Sample employees
  employees = [
    {
      id: '1',
      code: 'EMP001',
      name: '田中 太郎',
      email: 'tanaka@example.com',
      role: 'manager',
      department: '営業部',
      hourlyWage: 1500,
      hireDate: '2023-01-15',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      code: 'EMP002',
      name: '佐藤 花子',
      email: 'sato@example.com',
      role: 'staff',
      department: 'カスタマーサービス',
      hourlyWage: 1200,
      hireDate: '2023-03-01',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Sample wage rules
  wageRules = [
    {
      id: '1',
      name: '標準時給ルール',
      type: 'overtime',
      rate: 1.25,
      baseRate: 1000,
      overtimeRate: 1.25,
      nightRate: 1.25,
      holidayRate: 1.35,
      nightStartHour: 22,
      nightEndHour: 5,
      roundingMinutes: 15,
      conditions: {},
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  console.log('Database initialized with sample data');
  return Promise.resolve();
};

// Employee CRUD operations
export const getEmployees = () => Promise.resolve(employees);

export const getEmployee = (id: string) => 
  Promise.resolve(employees.find(emp => emp.id === id));

export const createEmployee = (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newEmployee: Employee = {
    ...employee,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  employees.push(newEmployee);
  return Promise.resolve(newEmployee);
};

export const updateEmployee = (id: string, updates: Partial<Employee>) => {
  const index = employees.findIndex(emp => emp.id === id);
  if (index === -1) return Promise.reject(new Error('Employee not found'));
  
  employees[index] = {
    ...employees[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return Promise.resolve(employees[index]);
};

export const deleteEmployee = (id: string) => {
  const index = employees.findIndex(emp => emp.id === id);
  if (index === -1) return Promise.reject(new Error('Employee not found'));
  
  employees.splice(index, 1);
  return Promise.resolve();
};

// Time record operations
export const createTimeRecord = (record: Omit<TimeRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newRecord: TimeRecord = {
    ...record,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  timeRecords.push(newRecord);
  return Promise.resolve(newRecord);
};

export const getTimeRecords = (employeeId?: string, startDate?: string, endDate?: string) => {
  let filtered = timeRecords;
  
  if (employeeId) {
    filtered = filtered.filter(record => record.employeeId === employeeId);
  }
  
  if (startDate) {
    filtered = filtered.filter(record => record.date >= startDate);
  }
  
  if (endDate) {
    filtered = filtered.filter(record => record.date <= endDate);
  }
  
  return Promise.resolve(filtered);
};

export const updateTimeRecord = (id: string, updates: Partial<TimeRecord>) => {
  const index = timeRecords.findIndex(record => record.id === id);
  if (index === -1) return Promise.reject(new Error('Time record not found'));
  
  timeRecords[index] = {
    ...timeRecords[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return Promise.resolve(timeRecords[index]);
};

// Wage rule operations
export const getWageRules = () => Promise.resolve(wageRules);

export const getActiveWageRule = () => 
  Promise.resolve(wageRules.find(rule => rule.isActive));

// Shift operations
export const createShift = (shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newShift: Shift = {
    ...shift,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  shifts.push(newShift);
  return Promise.resolve(newShift);
};

export const getShifts = (employeeId?: string, startDate?: string, endDate?: string) => {
  let filtered = shifts;
  
  if (employeeId) {
    filtered = filtered.filter(shift => shift.employeeId === employeeId);
  }
  
  if (startDate) {
    filtered = filtered.filter(shift => shift.date >= startDate);
  }
  
  if (endDate) {
    filtered = filtered.filter(shift => shift.date <= endDate);
  }
  
  return Promise.resolve(filtered);
};

// Payroll operations
export const calculatePayroll = (periodId: string) => {
  // This would contain complex payroll calculation logic
  console.log(`Calculating payroll for period ${periodId}`);
  
  // Mock calculation
  return Promise.resolve({
    totalAmount: 125000,
    records: [],
  });
};

// Export all for easy migration to Tauri SQLite
export const database = {
  initializeDatabase,
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  createTimeRecord,
  getTimeRecords,
  updateTimeRecord,
  getWageRules,
  getActiveWageRule,
  createShift,
  getShifts,
  calculatePayroll,
};