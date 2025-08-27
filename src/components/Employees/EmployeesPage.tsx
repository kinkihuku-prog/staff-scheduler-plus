import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Employee } from '@/types';
import { database } from '@/lib/database';
import { formatDuration } from '@/utils/dayjs';
import { EmployeeDialog } from './EmployeeDialog';
import { toast } from 'sonner';

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadEmployees = async () => {
    try {
      const data = database.getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('従業員データの読み込みに失敗しました:', error);
      toast.error('従業員データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setIsDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (confirm(`${employee.name}さんを削除してもよろしいですか？`)) {
      try {
        database.deleteEmployee(employee.id);
        await loadEmployees();
        toast.success('従業員を削除しました');
      } catch (error) {
        console.error('従業員の削除に失敗しました:', error);
        toast.error('従業員の削除に失敗しました');
      }
    }
  };

  const handleSaveEmployee = async () => {
    await loadEmployees();
    setIsDialogOpen(false);
    setSelectedEmployee(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">従業員管理</h1>
          <p className="text-muted-foreground text-sm">従業員の登録・編集・削除を行います</p>
        </div>
        <Button onClick={handleCreateEmployee} className="gap-2 h-8 px-3">
          <Plus size={14} />
          新規登録
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">総従業員数</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold">{employees.length}名</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">在籍者</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold text-success">
              {employees.filter(emp => emp.status === 'active').length}名
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">退職者</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold text-muted-foreground">
              {employees.filter(emp => emp.status === 'inactive').length}名
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">平均時給</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-xl font-bold">
              {employees.length > 0 
                ? Math.round(employees.reduce((sum, emp) => sum + emp.hourlyWage, 0) / employees.length)
                : 0}円
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="名前、従業員コード、役職で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>従業員一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>従業員コード</TableHead>
                <TableHead>氏名</TableHead>
                <TableHead>役職</TableHead>
                <TableHead>部署</TableHead>
                <TableHead>時給</TableHead>
                <TableHead>入社日</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    従業員が見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-mono">{employee.code}</TableCell>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.hourlyWage.toLocaleString()}円</TableCell>
                    <TableCell>{employee.hireDate}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                        {employee.status === 'active' ? '在籍' : '退職'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                            <Edit size={16} className="mr-2" />
                            編集
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteEmployee(employee)}
                            className="text-destructive"
                          >
                            <Trash2 size={16} className="mr-2" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employee Dialog */}
      <EmployeeDialog
        employee={selectedEmployee}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveEmployee}
      />
    </div>
  );
}