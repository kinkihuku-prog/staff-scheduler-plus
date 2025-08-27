import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { DashboardPage } from '../Dashboard/DashboardPage';
import { TimeClockPage } from '../TimeClock/TimeClockPage';
import { EmployeesPage } from '../Employees/EmployeesPage';
import { ShiftsPage } from '../Shifts/ShiftsPage';
import { WagesPage } from '../Wages/WagesPage';
import { PayrollPage } from '../Payroll/PayrollPage';
import { ReportsPage } from '../Reports/ReportsPage';
import { SettingsPage } from '../Settings/SettingsPage';
import { useTimeManagement } from '@/hooks/useTimeManagement';

export function MainLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { 
    currentStatus, 
    currentTime, 
    dashboardStats, 
    weeklyStats, 
    isInitialized,
    handleStatusChange 
  } = useTimeManagement();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            stats={dashboardStats}
            weeklyStats={weeklyStats}
            currentTime={currentTime}
            userStatus={currentStatus}
          />
        );
      case 'timeclock':
        return (
          <TimeClockPage
            currentStatus={currentStatus}
            onStatusChange={handleStatusChange}
          />
        );
      case 'shifts':
        return <ShiftsPage />;
      case 'employees':
        return <EmployeesPage />;
      case 'wages':
        return <WagesPage />;
      case 'payroll':
        return <PayrollPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <DashboardPage
            stats={dashboardStats}
            weeklyStats={weeklyStats}
            currentTime={currentTime}
            userStatus={currentStatus}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {!isInitialized ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">データベースを初期化しています...</p>
          </div>
        </div>
      ) : (
        <>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 overflow-auto">
            {renderContent()}
          </main>
        </>
      )}
    </div>
  );
}