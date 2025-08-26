import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Employee, TimeRecord } from '@/types';
import { database } from '@/lib/database';
import { calculateWorkingHours, formatDuration, getMonthRange } from '@/utils/dayjs';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Download, Calendar, Clock, User, TrendingUp, FileText } from 'lucide-react';
import dayjs from 'dayjs';

interface AttendanceReport {
  employee: Employee;
  workDays: number;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  averageHours: number;
  lateDays: number;
  earlyLeaveDays: number;
}

interface MonthlyStats {
  totalWorkingHours: number;
  totalOvertimeHours: number;
  totalEmployees: number;
  averageWorkingHours: number;
  totalPayroll: number;
}

export function ReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [attendanceReports, setAttendanceReports] = useState<AttendanceReport[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalWorkingHours: 0,
    totalOvertimeHours: 0,
    totalEmployees: 0,
    averageWorkingHours: 0,
    totalPayroll: 0
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    generateReports();
  }, [selectedMonth, selectedEmployee]);

  const loadData = () => {
    setEmployees(database.getEmployees());
  };

  const generateReports = async () => {
    if (employees.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      const { start, end } = getMonthRange(selectedMonth + '-01');
      const targetEmployees = selectedEmployee === 'all' 
        ? employees 
        : employees.filter(emp => emp.id === selectedEmployee);
      
      const reports: AttendanceReport[] = [];
      let totalWorkingHours = 0;
      let totalOvertimeHours = 0;
      let totalPayroll = 0;
      
      for (const employee of targetEmployees) {
        const timeRecords = database.getTimeRecords(employee.id, start, end);
        const report = generateEmployeeReport(employee, timeRecords);
        reports.push(report);
        
        totalWorkingHours += report.totalHours;
        totalOvertimeHours += report.overtimeHours;
        totalPayroll += (report.regularHours * employee.hourlyWage) + (report.overtimeHours * employee.hourlyWage * 1.25);
      }
      
      setAttendanceReports(reports);
      setMonthlyStats({
        totalWorkingHours,
        totalOvertimeHours,
        totalEmployees: targetEmployees.length,
        averageWorkingHours: targetEmployees.length > 0 ? totalWorkingHours / targetEmployees.length : 0,
        totalPayroll
      });
      
    } catch (error) {
      toast({
        title: "レポート生成エラー",
        description: "レポート生成中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateEmployeeReport = (employee: Employee, timeRecords: TimeRecord[]): AttendanceReport => {
    let totalMinutes = 0;
    let overtimeMinutes = 0;
    let workDays = 0;
    let lateDays = 0;
    let earlyLeaveDays = 0;
    
    // Group records by date
    const recordsByDate = timeRecords.reduce((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = [];
      }
      acc[record.date].push(record);
      return acc;
    }, {} as Record<string, TimeRecord[]>);
    
    Object.entries(recordsByDate).forEach(([date, dayRecords]) => {
      // Find clock in/out pairs
      const clockIn = dayRecords.find(r => r.clockIn && !r.clockOut);
      const clockOut = dayRecords.find(r => r.clockOut && r.clockIn);
      
      if (clockIn && clockOut && clockOut.clockOut) {
        workDays++;
        const workingHours = calculateWorkingHours(clockIn.clockIn, clockOut.clockOut, clockOut.breakDuration || 0);
        const regularHours = Math.min(workingHours, 8);
        const overtime = Math.max(0, workingHours - 8);
        
        totalMinutes += regularHours * 60;
        overtimeMinutes += overtime * 60;
        
        // Check for late arrival (after 9:00 AM)
        if (dayjs(clockIn.clockIn).hour() > 9) {
          lateDays++;
        }
        
        // Check for early leave (before 6:00 PM)
        if (clockOut.clockOut && dayjs(clockOut.clockOut).hour() < 18) {
          earlyLeaveDays++;
        }
      }
    });
    
    const totalHours = totalMinutes / 60;
    const overtimeHours = overtimeMinutes / 60;
    const regularHours = totalHours - overtimeHours;
    const averageHours = workDays > 0 ? totalHours / workDays : 0;
    
    return {
      employee,
      workDays,
      totalHours,
      regularHours,
      overtimeHours,
      averageHours,
      lateDays,
      earlyLeaveDays
    };
  };

  const exportAttendanceReport = () => {
    const csvContent = [
      ['従業員名', '従業員コード', '出勤日数', '総労働時間', '通常時間', '残業時間', '平均労働時間', '遅刻日数', '早退日数'],
      ...attendanceReports.map(report => [
        report.employee.name,
        report.employee.code,
        report.workDays.toString(),
        report.totalHours.toFixed(2),
        report.regularHours.toFixed(2),
        report.overtimeHours.toFixed(2),
        report.averageHours.toFixed(2),
        report.lateDays.toString(),
        report.earlyLeaveDays.toString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "エクスポート完了",
      description: "勤怠レポートをダウンロードしました。",
    });
  };

  const exportPayrollReport = () => {
    const csvContent = [
      ['従業員名', '従業員コード', '基本時給', '通常時間', '残業時間', '基本給', '残業代', '総支給額'],
      ...attendanceReports.map(report => [
        report.employee.name,
        report.employee.code,
        report.employee.hourlyWage.toString(),
        report.regularHours.toFixed(2),
        report.overtimeHours.toFixed(2),
        (report.regularHours * report.employee.hourlyWage).toLocaleString(),
        (report.overtimeHours * report.employee.hourlyWage * 1.25).toLocaleString(),
        ((report.regularHours * report.employee.hourlyWage) + (report.overtimeHours * report.employee.hourlyWage * 1.25)).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll_report_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "エクスポート完了",
      description: "給与レポートをダウンロードしました。",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">レポート</h1>
          <p className="text-muted-foreground">
            勤怠状況と給与データの分析レポートを確認します
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Label htmlFor="month-select">対象月</Label>
          <Input
            id="month-select"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <Label htmlFor="employee-select">従業員</Label>
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">対象従業員数</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyStats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {selectedEmployee === 'all' ? '全従業員' : '選択された従業員'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総労働時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(monthlyStats.totalWorkingHours)}</div>
            <p className="text-xs text-muted-foreground">
              残業: {formatDuration(monthlyStats.totalOvertimeHours)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均労働時間</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(monthlyStats.averageWorkingHours)}</div>
            <p className="text-xs text-muted-foreground">
              1人あたり月間平均
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総人件費</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{monthlyStats.totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              月間合計支給額
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attendance">勤怠レポート</TabsTrigger>
          <TabsTrigger value="payroll">給与レポート</TabsTrigger>
        </TabsList>
        
        <TabsContent value="attendance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">勤怠状況レポート</h3>
            <Button onClick={exportAttendanceReport} size="sm">
              <Download className="h-4 w-4 mr-2" />
              CSVエクスポート
            </Button>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>従業員</TableHead>
                  <TableHead>出勤日数</TableHead>
                  <TableHead>総労働時間</TableHead>
                  <TableHead>通常時間</TableHead>
                  <TableHead>残業時間</TableHead>
                  <TableHead>平均時間</TableHead>
                  <TableHead>遅刻</TableHead>
                  <TableHead>早退</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceReports.map((report) => (
                  <TableRow key={report.employee.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.employee.name}</div>
                        <div className="text-sm text-muted-foreground">{report.employee.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>{report.workDays}日</TableCell>
                    <TableCell>{formatDuration(report.totalHours)}</TableCell>
                    <TableCell>{formatDuration(report.regularHours)}</TableCell>
                    <TableCell>{formatDuration(report.overtimeHours)}</TableCell>
                    <TableCell>{formatDuration(report.averageHours)}</TableCell>
                    <TableCell>
                      {report.lateDays > 0 ? (
                        <span className="text-warning">{report.lateDays}回</span>
                      ) : (
                        <span className="text-muted-foreground">0回</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {report.earlyLeaveDays > 0 ? (
                        <span className="text-warning">{report.earlyLeaveDays}回</span>
                      ) : (
                        <span className="text-muted-foreground">0回</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="payroll" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">給与計算レポート</h3>
            <Button onClick={exportPayrollReport} size="sm">
              <Download className="h-4 w-4 mr-2" />
              CSVエクスポート
            </Button>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>従業員</TableHead>
                  <TableHead>基本時給</TableHead>
                  <TableHead>通常時間</TableHead>
                  <TableHead>残業時間</TableHead>
                  <TableHead>基本給</TableHead>
                  <TableHead>残業代</TableHead>
                  <TableHead className="text-right">総支給額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceReports.map((report) => {
                  const regularPay = report.regularHours * report.employee.hourlyWage;
                  const overtimePay = report.overtimeHours * report.employee.hourlyWage * 1.25;
                  const totalPay = regularPay + overtimePay;
                  
                  return (
                    <TableRow key={report.employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.employee.name}</div>
                          <div className="text-sm text-muted-foreground">{report.employee.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>¥{report.employee.hourlyWage.toLocaleString()}</TableCell>
                      <TableCell>{formatDuration(report.regularHours)}</TableCell>
                      <TableCell>{formatDuration(report.overtimeHours)}</TableCell>
                      <TableCell>¥{regularPay.toLocaleString()}</TableCell>
                      <TableCell>¥{overtimePay.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">
                        ¥{totalPay.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}