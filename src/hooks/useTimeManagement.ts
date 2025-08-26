import { useState, useEffect } from 'react';
import dayjs from '@/utils/dayjs';
import { WorkStatus, DashboardStats, WeeklyStats } from '@/types';
import { database } from '@/utils/database';

// Time management hook - will be enhanced for Tauri SQLite
export function useTimeManagement() {
  const [currentStatus, setCurrentStatus] = useState<WorkStatus>('offline');
  const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'));
  const [isInitialized, setIsInitialized] = useState(false);

  // Mock dashboard stats
  const [dashboardStats] = useState<DashboardStats>({
    totalEmployees: 25,
    currentlyWorking: 18,
    onBreak: 3,
    totalHoursToday: 142.5,
    pendingApprovals: 2,
  });

  // Mock weekly stats
  const [weeklyStats] = useState<WeeklyStats[]>([
    { date: dayjs().subtract(6, 'day').format('YYYY-MM-DD'), hours: 8, overtime: 0.5 },
    { date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'), hours: 8, overtime: 1 },
    { date: dayjs().subtract(4, 'day').format('YYYY-MM-DD'), hours: 7.5, overtime: 0 },
    { date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'), hours: 8, overtime: 0.5 },
    { date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), hours: 8, overtime: 2 },
    { date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), hours: 8, overtime: 1 },
    { date: dayjs().format('YYYY-MM-DD'), hours: 7.5, overtime: 0.5 },
  ]);

  // Initialize database on first load
  useEffect(() => {
    const initDB = async () => {
      try {
        await database.initializeDatabase();
        setIsInitialized(true);
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    if (!isInitialized) {
      initDB();
    }
  }, [isInitialized]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().format('HH:mm:ss'));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (newStatus: WorkStatus) => {
    setCurrentStatus(newStatus);
    
    // In Tauri version, this would save to SQLite
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
    console.log(`Status changed to: ${newStatus} at ${timestamp}`);
    
    // Create time record entry
    database.createTimeRecord({
      employeeId: '1', // Current user ID - would come from auth
      date: dayjs().format('YYYY-MM-DD'),
      status: newStatus === 'offline' ? 'completed' : 'working',
      workingHours: 0,
      overtimeHours: 0,
      breakDuration: 0,
    });
  };

  return {
    currentStatus,
    currentTime,
    dashboardStats,
    weeklyStats,
    isInitialized,
    handleStatusChange,
    // Database operations
    ...database,
  };
}