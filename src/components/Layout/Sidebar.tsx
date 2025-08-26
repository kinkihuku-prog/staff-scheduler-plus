import { 
  Clock, 
  Calendar, 
  Users, 
  DollarSign, 
  Calculator, 
  Settings,
  BarChart3,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigation = [
  { id: 'dashboard', name: 'ダッシュボード', icon: Home },
  { id: 'timeclock', name: '打刻', icon: Clock },
  { id: 'shifts', name: 'シフト管理', icon: Calendar },
  { id: 'employees', name: '従業員', icon: Users },
  { id: 'wages', name: '時給・手当', icon: DollarSign },
  { id: 'payroll', name: '給与計算', icon: Calculator },
  { id: 'reports', name: 'レポート', icon: BarChart3 },
  { id: 'settings', name: '設定', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-card border-r border shadow-card h-screen flex flex-col">
      <div className="p-6 border-b border">
        <h1 className="text-xl font-bold text-foreground">勤怠管理システム</h1>
        <p className="text-sm text-muted-foreground mt-1">Time Management</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 h-11',
                isActive && 'bg-gradient-primary text-primary-foreground shadow-subtle'
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={18} />
              <span className="font-medium">{item.name}</span>
            </Button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border">
        <div className="text-xs text-muted-foreground">
          © 2024 Time Management System
        </div>
      </div>
    </div>
  );
}