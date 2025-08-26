import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { DashboardPage } from '../Dashboard/DashboardPage';
import { TimeClockPage } from '../TimeClock/TimeClockPage';
import { useTimeManagement } from '@/hooks/useTimeManagement';
import { Card } from '@/components/ui/card';

// Placeholder components for other pages
function ShiftsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">シフト管理</h1>
      <Card className="p-8 text-center shadow-card">
        <p className="text-muted-foreground">シフト管理機能は準備中です</p>
      </Card>
    </div>
  );
}

function EmployeesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">従業員管理</h1>
      <Card className="p-8 text-center shadow-card">
        <p className="text-muted-foreground">従業員管理機能は準備中です</p>
      </Card>
    </div>
  );
}

function WagesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">時給・手当設定</h1>
      <Card className="p-8 text-center shadow-card">
        <p className="text-muted-foreground">時給・手当設定機能は準備中です</p>
      </Card>
    </div>
  );
}

function PayrollPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">給与計算</h1>
      <Card className="p-8 text-center shadow-card">
        <p className="text-muted-foreground">給与計算機能は準備中です</p>
      </Card>
    </div>
  );
}

function ReportsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">レポート</h1>
      <Card className="p-8 text-center shadow-card">
        <p className="text-muted-foreground">レポート機能は準備中です</p>
      </Card>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">設定</h1>
      <Card className="p-8 text-center shadow-card">
        <p className="text-muted-foreground">設定機能は準備中です</p>
      </Card>
    </div>
  );
}

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