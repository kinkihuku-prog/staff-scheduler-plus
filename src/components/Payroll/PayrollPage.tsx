import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Employee, TimeRecord, Shift } from '@/types';
import { database } from '@/lib/database';
import { calculateWorkingHours, calculateOvertimeHours, formatDuration, getMonthRange } from '@/utils/dayjs';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Download, Calendar, Clock, DollarSign, FileText } from 'lucide-react';
import dayjs from 'dayjs';

interface PayrollData {
  employee: Employee;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
}

export function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [estimatedPayroll, setEstimatedPayroll] = useState<PayrollData[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculatePayroll();
  }, [selectedMonth, employees]);

  const loadData = () => {
    setEmployees(database.getEmployees());
  };

  const calculatePayroll = async () => {
    if (employees.length === 0) return;
    
    setIsCalculating(true);
    
    try {
      const { start, end } = getMonthRange(selectedMonth + '-01');
      
      // Calculate actual payroll from time records
      const actualPayroll: PayrollData[] = [];
      // Calculate estimated payroll from shifts
      const estimatedPayroll: PayrollData[] = [];
      
      for (const employee of employees) {
        // Get time records for actual payroll
        const timeRecords = database.getTimeRecords(employee.id, start, end);
        const actualData = calculateEmployeePayroll(employee, timeRecords, 'actual');
        actualPayroll.push(actualData);
        
        // Get shifts for estimated payroll
        const shifts = database.getShifts(employee.id, start, end);
        const estimatedData = calculateEmployeePayroll(employee, shifts, 'estimated');
        estimatedPayroll.push(estimatedData);
      }
      
      setPayrollData(actualPayroll);
      setEstimatedPayroll(estimatedPayroll);
      
    } catch (error) {
      toast({
        title: "給与計算エラー",
        description: "給与計算中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateEmployeePayroll = (
    employee: Employee, 
    records: (TimeRecord | Shift)[], 
    type: 'actual' | 'estimated'
  ): PayrollData => {
    let totalMinutes = 0;
    let overtimeMinutes = 0;
    
    records.forEach(record => {
      let workingHours = 0;
      if (type === 'actual' && 'clockIn' in record && 'clockOut' in record) {
        // Time record calculation
        if (record.clockOut) {
          workingHours = calculateWorkingHours(record.clockIn, record.clockOut, record.breakDuration || 0);
        }
      } else if (type === 'estimated' && 'startTime' in record && 'endTime' in record) {
        // Shift calculation
        const startDateTime = dayjs(record.date + ' ' + record.startTime);
        const endDateTime = dayjs(record.date + ' ' + record.endTime);
        workingHours = endDateTime.diff(startDateTime, 'minute') / 60;
      }
      
      const regularHours = Math.min(workingHours, 8);
      const overtime = Math.max(0, workingHours - 8);
      
      totalMinutes += regularHours * 60;
      overtimeMinutes += overtime * 60;
    });
    
    const regularHours = totalMinutes / 60;
    const overtimeHours = overtimeMinutes / 60;
    const totalHours = regularHours + overtimeHours;
    
    const regularPay = regularHours * employee.hourlyWage;
    const overtimePay = overtimeHours * employee.hourlyWage * 1.25; // 1.25x overtime rate
    const totalPay = regularPay + overtimePay;
    
    return {
      employee,
      regularHours,
      overtimeHours,
      totalHours,
      regularPay,
      overtimePay,
      totalPay
    };
  };

  const exportPayrollData = (data: PayrollData[], filename: string) => {
    const csvContent = [
      ['従業員名', '従業員コード', '通常時間', '残業時間', '総時間', '基本給', '残業代', '総支給額'],
      ...data.map(item => [
        item.employee.name,
        item.employee.code,
        item.regularHours.toFixed(2),
        item.overtimeHours.toFixed(2),
        item.totalHours.toFixed(2),
        item.regularPay.toLocaleString(),
        item.overtimePay.toLocaleString(),
        item.totalPay.toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "エクスポート完了",
      description: `${filename}をダウンロードしました。`,
    });
  };

  const totalActualPay = payrollData.reduce((sum, item) => sum + item.totalPay, 0);
  const totalEstimatedPay = estimatedPayroll.reduce((sum, item) => sum + item.totalPay, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">給与計算</h1>
          <p className="text-muted-foreground">
            実打刻とシフト予定に基づく給与計算を管理します
          </p>
        </div>
        
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">対象従業員数</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              活動中の従業員
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">実績給与総額</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalActualPay.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              実打刻ベース
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">予定給与総額</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalEstimatedPay.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              シフト予定ベース
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">差額</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{(totalActualPay - totalEstimatedPay).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              実績 - 予定
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Data Tables */}
      <Tabs defaultValue="actual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="actual">実績給与（実打刻ベース）</TabsTrigger>
          <TabsTrigger value="estimated">予定給与（シフトベース）</TabsTrigger>
        </TabsList>
        
        <TabsContent value="actual" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">実打刻に基づく給与計算</h3>
            <Button 
              onClick={() => exportPayrollData(payrollData, `payroll_actual_${selectedMonth}.csv`)}
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              CSVエクスポート
            </Button>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>従業員</TableHead>
                  <TableHead>通常時間</TableHead>
                  <TableHead>残業時間</TableHead>
                  <TableHead>総時間</TableHead>
                  <TableHead>基本給</TableHead>
                  <TableHead>残業代</TableHead>
                  <TableHead className="text-right">総支給額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollData.map((item) => (
                  <TableRow key={item.employee.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.employee.name}</div>
                        <div className="text-sm text-muted-foreground">{item.employee.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDuration(item.regularHours)}</TableCell>
                    <TableCell>{formatDuration(item.overtimeHours)}</TableCell>
                    <TableCell>{formatDuration(item.totalHours)}</TableCell>
                    <TableCell>¥{item.regularPay.toLocaleString()}</TableCell>
                    <TableCell>¥{item.overtimePay.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">
                      ¥{item.totalPay.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="estimated" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">シフト予定に基づく給与見込み</h3>
            <Button 
              onClick={() => exportPayrollData(estimatedPayroll, `payroll_estimated_${selectedMonth}.csv`)}
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              CSVエクスポート
            </Button>
          </div>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>従業員</TableHead>
                  <TableHead>通常時間</TableHead>
                  <TableHead>残業時間</TableHead>
                  <TableHead>総時間</TableHead>
                  <TableHead>基本給</TableHead>
                  <TableHead>残業代</TableHead>
                  <TableHead className="text-right">総支給額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimatedPayroll.map((item) => (
                  <TableRow key={item.employee.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.employee.name}</div>
                        <div className="text-sm text-muted-foreground">{item.employee.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDuration(item.regularHours)}</TableCell>
                    <TableCell>{formatDuration(item.overtimeHours)}</TableCell>
                    <TableCell>{formatDuration(item.totalHours)}</TableCell>
                    <TableCell>¥{item.regularPay.toLocaleString()}</TableCell>
                    <TableCell>¥{item.overtimePay.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">
                      ¥{item.totalPay.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}