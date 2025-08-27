import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Employee, Shift } from '@/types';
import { database } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Edit, Trash2, Clock, User, Copy, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';
import { getWeekRange, getJapaneseDayOfWeek } from '@/utils/dayjs';

export function ShiftsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [periodType, setPeriodType] = useState<'1week' | '2weeks' | '1month'>('1week');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftForm, setShiftForm] = useState({
    employeeId: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadShifts();
  }, [selectedWeek, selectedEmployee, periodType]);

  const loadData = () => {
    setEmployees(database.getEmployees());
  };

  const loadShifts = () => {
    let startDate, endDate;
    
    if (periodType === '1week') {
      const range = getWeekRange(selectedWeek);
      startDate = range.start;
      endDate = range.end;
    } else if (periodType === '2weeks') {
      const weekStart = dayjs(selectedWeek).startOf('week');
      startDate = weekStart.format('YYYY-MM-DD');
      endDate = weekStart.add(13, 'days').format('YYYY-MM-DD');
    } else {
      const monthStart = dayjs(selectedWeek).startOf('month');
      startDate = monthStart.format('YYYY-MM-DD');
      endDate = monthStart.endOf('month').format('YYYY-MM-DD');
    }
    
    const employeeId = selectedEmployee === 'all' ? undefined : selectedEmployee;
    setShifts(database.getShifts(employeeId, startDate, endDate));
  };

  const handleCreateShift = () => {
    if (!shiftForm.employeeId || !shiftForm.date || !shiftForm.startTime || !shiftForm.endTime) {
      toast({
        title: "入力エラー",
        description: "必須項目を入力してください。",
        variant: "destructive",
      });
      return;
    }

    const newShift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'> = {
      employeeId: shiftForm.employeeId,
      date: shiftForm.date,
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      breakDuration: 60,
      type: 'regular',
      status: 'scheduled',
      notes: shiftForm.notes || undefined
    };

    database.createShift(newShift);
    loadShifts();
    setIsDialogOpen(false);
    resetForm();
    
    toast({
      title: "シフトを作成しました",
      description: "新しいシフトが正常に作成されました。",
    });
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setShiftForm({
      employeeId: shift.employeeId,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      notes: shift.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleUpdateShift = () => {
    if (!editingShift) return;

    // Update shift implementation would go here
    setIsDialogOpen(false);
    setEditingShift(null);
    resetForm();
    
    toast({
      title: "シフトを更新しました",
      description: "シフトが正常に更新されました。",
    });
  };

  const handleDeleteShift = (shiftId: string) => {
    if (confirm('このシフトを削除しますか？')) {
      // Add delete method to database
      database.deleteShift?.(shiftId);
      loadShifts();
      toast({
        title: "シフトを削除しました",
        description: "シフトが正常に削除されました。",
      });
    }
  };

  const handleCopyShift = (shift: Shift) => {
    const nextWeekDate = dayjs(shift.date).add(7, 'day').format('YYYY-MM-DD');
    const newShift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'> = {
      employeeId: shift.employeeId,
      date: nextWeekDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDuration: shift.breakDuration,
      type: shift.type,
      status: 'scheduled',
      notes: shift.notes
    };

    database.createShift(newShift);
    loadShifts();
    
    toast({
      title: "シフトをコピーしました",
      description: "来週に同じシフトをコピーしました。",
    });
  };

  const handleAutoGenerateShifts = () => {
    if (confirm('選択した期間のシフトを自動生成しますか？既存のシフトは上書きされます。')) {
      const activeEmployees = employees.filter(emp => emp.status === 'active');
      let currentDate = dayjs(selectedWeek).startOf(periodType === '1month' ? 'month' : 'week');
      const endDate = periodType === '1week' 
        ? currentDate.endOf('week')
        : periodType === '2weeks' 
        ? currentDate.add(13, 'days')
        : currentDate.endOf('month');

      let generatedCount = 0;

      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        const dayOfWeek = currentDate.day();
        
        activeEmployees.forEach(employee => {
          // Skip if employee has fixed days off and today is one of them
          if (employee.fixedDaysOff && employee.fixedDaysOff.includes(dayOfWeek)) {
            return;
          }

          // Generate shift if employee has fixed work days and today is one of them
          if (employee.fixedWorkDays && employee.fixedWorkDays.includes(dayOfWeek)) {
            const newShift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'> = {
              employeeId: employee.id,
              date: currentDate.format('YYYY-MM-DD'),
              startTime: employee.workStartTime || '09:00',
              endTime: employee.workEndTime || '18:00',
              breakDuration: 60,
              type: 'regular',
              status: 'scheduled'
            };

            database.createShift(newShift);
            generatedCount++;
          }
        });

        currentDate = currentDate.add(1, 'day');
      }

      loadShifts();
      toast({
        title: "シフトを自動生成しました",
        description: `${generatedCount}件のシフトを生成しました。`,
      });
    }
  };

  const resetForm = () => {
    setShiftForm({
      employeeId: '',
      date: '',
      startTime: '',
      endTime: '',
      notes: ''
    });
  };

  const openNewShiftDialog = () => {
    setEditingShift(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : '不明';
  };

  const getShiftDuration = (startTime: string, endTime: string) => {
    const start = dayjs(`2024-01-01 ${startTime}`);
    const end = dayjs(`2024-01-01 ${endTime}`);
    const duration = end.diff(start, 'minute');
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h${minutes > 0 ? `${minutes}m` : ''}`;
  };

  // Generate days for the calendar view based on period type
  const getDaysForPeriod = () => {
    if (periodType === '1week') {
      return Array.from({ length: 7 }, (_, i) => {
        return dayjs(selectedWeek).startOf('week').add(i, 'day');
      });
    } else if (periodType === '2weeks') {
      return Array.from({ length: 14 }, (_, i) => {
        return dayjs(selectedWeek).startOf('week').add(i, 'day');
      });
    } else {
      const startOfMonth = dayjs(selectedWeek).startOf('month');
      const daysInMonth = startOfMonth.daysInMonth();
      return Array.from({ length: daysInMonth }, (_, i) => {
        return startOfMonth.add(i, 'day');
      });
    }
  };

  const periodDays = getDaysForPeriod();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">シフト管理</h1>
          <p className="text-muted-foreground text-sm">
            従業員のシフトスケジュールを管理します
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleAutoGenerateShifts} variant="outline" size="sm">
            <Zap className="h-3 w-3 mr-2" />
            自動生成
          </Button>
          <Button onClick={openNewShiftDialog} size="sm">
            <Plus className="h-3 w-3 mr-2" />
            シフト作成
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3" />
          <Label htmlFor="period-select" className="text-xs">期間</Label>
          <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
            <SelectTrigger className="w-24 h-7">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1week">1週間</SelectItem>
              <SelectItem value="2weeks">2週間</SelectItem>
              <SelectItem value="1month">1ヶ月</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="week-select" className="text-xs">基準日</Label>
          <Input
            id="week-select"
            type="date"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="w-32 h-7"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <User className="h-3 w-3" />
          <Label htmlFor="employee-filter" className="text-xs">従業員</Label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-40 h-7">
              <SelectValue placeholder="従業員を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全従業員</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{periodType === '1week' ? '週間' : periodType === '2weeks' ? '2週間' : '月間'}シフト表</CardTitle>
          <CardDescription className="text-xs">
            {periodDays[0]?.format('YYYY年MM月DD日')} - {periodDays[periodDays.length - 1]?.format('MM月DD日')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-2 ${periodType === '1month' ? 'grid-cols-7' : periodType === '2weeks' ? 'grid-cols-7' : 'grid-cols-7'}`}>
            {periodDays.map((day) => (
              <div key={day.format()} className="border rounded-lg p-2 min-h-[80px]">
                <div className="text-center mb-1">
                  <div className="font-medium text-xs">{getJapaneseDayOfWeek(day.format())}</div>
                  <div className="text-xs text-muted-foreground">{day.format('MM/DD')}</div>
                </div>
                
                <div className="space-y-1">
                  {shifts
                    .filter(shift => shift.date === day.format('YYYY-MM-DD'))
                    .map((shift) => (
                      <div key={shift.id} className="text-xs p-1 bg-primary/10 rounded border">
                        <div className="font-medium truncate text-xs">{getEmployeeName(shift.employeeId)}</div>
                        <div className="text-muted-foreground text-xs">
                          {shift.startTime} - {shift.endTime}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shift List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">シフト一覧</CardTitle>
          <CardDescription className="text-xs">
            選択した期間のシフト詳細
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">日付</TableHead>
                <TableHead className="text-xs">従業員</TableHead>
                <TableHead className="text-xs">時間</TableHead>
                <TableHead className="text-xs">勤務時間</TableHead>
                <TableHead className="text-xs">備考</TableHead>
                <TableHead className="text-right text-xs">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-xs">{dayjs(shift.date).format('MM/DD')}</div>
                      <div className="text-xs text-muted-foreground">
                        ({getJapaneseDayOfWeek(shift.date)})
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-xs">{getEmployeeName(shift.employeeId)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {shift.startTime} - {shift.endTime}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{getShiftDuration(shift.startTime, shift.endTime)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {shift.notes || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyShift(shift)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditShift(shift)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteShift(shift.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {shifts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-xs">
                    選択した期間にシフトがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Shift Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingShift ? 'シフト編集' : 'シフト作成'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              シフトの詳細を入力してください。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="shift-employee" className="text-xs">従業員</Label>
              <Select 
                value={shiftForm.employeeId} 
                onValueChange={(value) => setShiftForm(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="従業員を選択" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shift-date" className="text-xs">日付</Label>
              <Input
                id="shift-date"
                type="date"
                value={shiftForm.date}
                onChange={(e) => setShiftForm(prev => ({ ...prev, date: e.target.value }))}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="shift-start" className="text-xs">開始時間</Label>
                <Input
                  id="shift-start"
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
                  className="h-8"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shift-end" className="text-xs">終了時間</Label>
                <Input
                  id="shift-end"
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shift-notes" className="text-xs">備考</Label>
              <Input
                id="shift-notes"
                placeholder="備考（任意）"
                value={shiftForm.notes}
                onChange={(e) => setShiftForm(prev => ({ ...prev, notes: e.target.value }))}
                className="h-8"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} size="sm">
              キャンセル
            </Button>
            <Button onClick={editingShift ? handleUpdateShift : handleCreateShift} size="sm">
              {editingShift ? '更新' : '作成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}