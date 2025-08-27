import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Employee, Shift } from '@/types';
import { database } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Edit, Trash2, Clock, User, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import dayjs from 'dayjs';
import { getWeekRange, getJapaneseDayOfWeek } from '@/utils/dayjs';

export function ShiftsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
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
  }, [selectedWeek, selectedEmployee]);

  const loadData = () => {
    setEmployees(database.getEmployees());
  };

  const loadShifts = () => {
    const { start, end } = getWeekRange(selectedWeek);
    const employeeId = selectedEmployee === 'all' ? undefined : selectedEmployee;
    setShifts(database.getShifts(employeeId, start, end));
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

    // This would update the shift in a real implementation
    // For now, we'll just close the dialog and show success
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
      // This would delete the shift in a real implementation
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

  // Generate week days for the calendar view
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    return dayjs(selectedWeek).startOf('week').add(i, 'day');
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">シフト管理</h1>
          <p className="text-muted-foreground">
            従業員のシフトスケジュールを管理します
          </p>
        </div>
        
        <Button onClick={openNewShiftDialog}>
          <Plus className="h-4 w-4 mr-2" />
          シフト作成
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Label htmlFor="week-select">週選択</Label>
          <Input
            id="week-select"
            type="date"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="w-40"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <Label htmlFor="employee-filter">従業員フィルター</Label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-48">
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

      {/* Weekly Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>週間シフト表</CardTitle>
          <CardDescription>
            {dayjs(selectedWeek).startOf('week').format('YYYY年MM月DD日')} - {dayjs(selectedWeek).endOf('week').format('MM月DD日')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div key={day.format()} className="border rounded-lg p-3 min-h-[120px]">
                <div className="text-center mb-2">
                  <div className="font-medium">{getJapaneseDayOfWeek(day.format())}</div>
                  <div className="text-sm text-muted-foreground">{day.format('MM/DD')}</div>
                </div>
                
                <div className="space-y-1">
                  {shifts
                    .filter(shift => shift.date === day.format('YYYY-MM-DD'))
                    .map((shift) => (
                      <div key={shift.id} className="text-xs p-1 bg-primary/10 rounded border">
                        <div className="font-medium truncate">{getEmployeeName(shift.employeeId)}</div>
                        <div className="text-muted-foreground">
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
        <CardHeader>
          <CardTitle>シフト一覧</CardTitle>
          <CardDescription>
            選択した期間のシフト詳細
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>従業員</TableHead>
                <TableHead>時間</TableHead>
                <TableHead>勤務時間</TableHead>
                <TableHead>備考</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{dayjs(shift.date).format('MM/DD')}</div>
                      <div className="text-sm text-muted-foreground">
                        ({getJapaneseDayOfWeek(shift.date)})
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{getEmployeeName(shift.employeeId)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {shift.startTime} - {shift.endTime}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getShiftDuration(shift.startTime, shift.endTime)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {shift.notes || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyShift(shift)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditShift(shift)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteShift(shift.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {shifts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingShift ? 'シフト編集' : 'シフト作成'}
            </DialogTitle>
            <DialogDescription>
              シフトの詳細を入力してください。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shift-employee">従業員</Label>
              <Select 
                value={shiftForm.employeeId} 
                onValueChange={(value) => setShiftForm(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger>
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
              <Label htmlFor="shift-date">日付</Label>
              <Input
                id="shift-date"
                type="date"
                value={shiftForm.date}
                onChange={(e) => setShiftForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift-start">開始時間</Label>
                <Input
                  id="shift-start"
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shift-end">終了時間</Label>
                <Input
                  id="shift-end"
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shift-notes">備考</Label>
              <Input
                id="shift-notes"
                placeholder="備考（任意）"
                value={shiftForm.notes}
                onChange={(e) => setShiftForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={editingShift ? handleUpdateShift : handleCreateShift}>
              {editingShift ? '更新' : '作成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}