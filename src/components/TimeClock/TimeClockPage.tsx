import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Coffee,
  CheckCircle,
  Calendar
} from 'lucide-react';
import dayjs from 'dayjs';
import { WorkStatus } from '@/types';

interface TimeClockPageProps {
  currentStatus: WorkStatus;
  onStatusChange: (status: WorkStatus) => void;
}

export function TimeClockPage({ currentStatus, onStatusChange }: TimeClockPageProps) {
  const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'));

  // Update current time every second
  useState(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().format('HH:mm:ss'));
    }, 1000);
    return () => clearInterval(interval);
  });

  const statusConfig = {
    offline: { 
      label: '退勤中', 
      color: 'bg-offline text-offline-foreground',
      nextAction: 'working',
      nextLabel: '出勤',
      icon: CheckCircle
    },
    working: { 
      label: '勤務中', 
      color: 'bg-working text-working-foreground',
      nextAction: 'break',
      nextLabel: '休憩開始',
      icon: Play
    },
    break: { 
      label: '休憩中', 
      color: 'bg-break text-break-foreground',
      nextAction: 'working',
      nextLabel: '休憩終了',
      icon: Coffee
    },
    overtime: { 
      label: '残業中', 
      color: 'bg-overtime text-overtime-foreground',
      nextAction: 'offline',
      nextLabel: '退勤',
      icon: Clock
    },
  };

  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  const handleClockAction = () => {
    const nextStatus = config.nextAction as WorkStatus;
    onStatusChange(nextStatus);
  };

  const handleForceClockOut = () => {
    onStatusChange('offline');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">打刻システム</h1>
        <p className="text-muted-foreground">
          {dayjs().format('YYYY年MM月DD日 (ddd)')}
        </p>
      </div>

      {/* Current Time Display */}
      <Card className="bg-gradient-primary text-primary-foreground shadow-elevated">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <div className="text-6xl font-mono font-bold mb-4">
              {currentTime}
            </div>
            <Badge className={`${config.color} px-6 py-2 text-lg font-medium`}>
              <StatusIcon size={20} className="mr-2" />
              {config.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-center">基本操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              size="lg" 
              className="w-full h-16 text-lg bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={handleClockAction}
            >
              {config.nextLabel}
            </Button>
            
            {currentStatus !== 'offline' && (
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-12"
                onClick={handleForceClockOut}
              >
                <Square size={20} className="mr-2" />
                強制退勤
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-center">今日の記録</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">出勤時刻</span>
                <span className="font-mono">08:30</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">休憩時間</span>
                <span className="font-mono">01:00</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">勤務時間</span>
                <span className="font-mono">7.5h</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">残業時間</span>
                <span className="font-mono text-overtime">0.5h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Records */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            最近の勤務記録
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => {
              const date = dayjs().subtract(i, 'day');
              return (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="font-medium">{date.format('MM/DD (ddd)')}</div>
                    <div className="text-sm text-muted-foreground">
                      08:30 - 18:00 (休憩: 1h)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold">8.5h</div>
                    <div className="text-sm text-muted-foreground">合計</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}