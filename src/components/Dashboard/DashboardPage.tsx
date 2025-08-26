import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Users, 
  Coffee, 
  TrendingUp, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import { DashboardStats, WeeklyStats, WorkStatus } from '@/types';
import { cn } from '@/lib/utils';

interface DashboardPageProps {
  stats: DashboardStats;
  weeklyStats: WeeklyStats[];
  currentTime: string;
  userStatus: WorkStatus;
}

export function DashboardPage({ stats, weeklyStats, currentTime, userStatus }: DashboardPageProps) {
  const statusConfig = {
    offline: { label: '退勤中', color: 'bg-offline', icon: CheckCircle },
    working: { label: '勤務中', color: 'bg-working', icon: Clock },
    break: { label: '休憩中', color: 'bg-break', icon: Coffee },
    overtime: { label: '残業中', color: 'bg-overtime', icon: Clock },
  };

  const currentStatus = statusConfig[userStatus];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ダッシュボード</h1>
          <p className="text-muted-foreground mt-1">
            {dayjs().format('YYYY年MM月DD日 (ddd)')} - {currentTime}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge 
            className={cn(
              'px-4 py-2 text-sm font-medium',
              currentStatus.color,
              'text-white'
            )}
          >
            <StatusIcon size={16} className="mr-2" />
            {currentStatus.label}
          </Badge>
        </div>
      </div>

      {/* Current Status Card */}
      <Card className="bg-gradient-primary text-primary-foreground shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={24} />
            今日の勤務状況
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">08:30</div>
              <div className="text-sm opacity-90">出勤時刻</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">01:00</div>
              <div className="text-sm opacity-90">休憩時間</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">7.5h</div>
              <div className="text-sm opacity-90">勤務時間</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">0.5h</div>
              <div className="text-sm opacity-90">残業時間</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              総従業員数
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              アクティブな従業員
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              勤務中
            </CardTitle>
            <div className="h-2 w-2 rounded-full bg-working"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-working">{stats.currentlyWorking}</div>
            <p className="text-xs text-muted-foreground">
              現在勤務中の従業員
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              休憩中
            </CardTitle>
            <Coffee className="h-4 w-4 text-break" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-break">{stats.onBreak}</div>
            <p className="text-xs text-muted-foreground">
              休憩中の従業員
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              承認待ち
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              修正申請
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Overview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} />
            今週の勤務状況
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyStats.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-primary rounded-full opacity-70"></div>
                  <div>
                    <div className="font-medium">{dayjs(day.date).format('MM/DD (ddd)')}</div>
                    <div className="text-sm text-muted-foreground">
                      通常: {day.hours}h, 残業: {day.overtime}h
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{day.hours + day.overtime}h</div>
                  <div className="text-xs text-muted-foreground">合計</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}