import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';

// Configure dayjs for Japanese time management system
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(weekday);
dayjs.extend(weekOfYear);

// Set Japanese locale
dayjs.locale('ja');

// Set default timezone to Japan
dayjs.tz.setDefault('Asia/Tokyo');

// Utility functions for time calculations
export const calculateWorkingHours = (clockIn: string, clockOut: string, breakDuration: number = 0): number => {
  const start = dayjs(clockIn);
  const end = dayjs(clockOut);
  const totalMinutes = end.diff(start, 'minute');
  const workingMinutes = totalMinutes - breakDuration;
  return Math.max(0, workingMinutes / 60);
};

export const calculateOvertimeHours = (workingHours: number, regularHours: number = 8): number => {
  return Math.max(0, workingHours - regularHours);
};

export const isNightHours = (time: string, nightStart: number = 22, nightEnd: number = 5): boolean => {
  const hour = dayjs(time).hour();
  if (nightStart > nightEnd) {
    // Night shift crosses midnight (e.g., 22:00 - 05:00)
    return hour >= nightStart || hour < nightEnd;
  } else {
    // Normal night hours (e.g., 23:00 - 06:00)
    return hour >= nightStart && hour < nightEnd;
  }
};

export const roundToNearestMinutes = (minutes: number, roundTo: number = 15): number => {
  return Math.round(minutes / roundTo) * roundTo;
};

export const formatDuration = (hours: number): string => {
  const duration = dayjs.duration(hours, 'hours');
  const h = Math.floor(duration.asHours());
  const m = duration.minutes();
  
  if (h === 0) {
    return `${m}分`;
  } else if (m === 0) {
    return `${h}時間`;
  } else {
    return `${h}時間${m}分`;
  }
};

export const getJapaneseDayOfWeek = (date: string | Date): string => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[dayjs(date).day()];
};

export const isWeekend = (date: string | Date): boolean => {
  const day = dayjs(date).day();
  return day === 0 || day === 6; // Sunday or Saturday
};

export const getWeekRange = (date: string | Date): { start: string; end: string } => {
  const d = dayjs(date);
  const start = d.startOf('week').format('YYYY-MM-DD');
  const end = d.endOf('week').format('YYYY-MM-DD');
  return { start, end };
};

export const getMonthRange = (date: string | Date): { start: string; end: string } => {
  const d = dayjs(date);
  const start = d.startOf('month').format('YYYY-MM-DD');
  const end = d.endOf('month').format('YYYY-MM-DD');
  return { start, end };
};

export default dayjs;