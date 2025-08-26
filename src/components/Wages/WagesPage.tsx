import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Employee, WageRule } from '@/types';
import { database } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Plus, Clock, Moon, Calendar } from 'lucide-react';

export function WagesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [wageRules, setWageRules] = useState<WageRule[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setEmployees(database.getEmployees());
    setWageRules(database.getWageRules());
  };

  const handleUpdateEmployeeWage = (employeeId: string, hourlyWage: number) => {
    const updated = database.updateEmployee(employeeId, { hourlyWage });
    if (updated) {
      loadData();
      toast({
        title: "時給を更新しました",
        description: "従業員の時給が正常に更新されました。",
      });
    }
  };

  const createNewWageRule = () => {
    const newRule: Omit<WageRule, 'id' | 'createdAt' | 'updatedAt'> = {
      name: '新しい手当ルール',
      type: 'overtime',
      rate: 1.25,
      conditions: {},
      isActive: false
    };
    
    database.createWageRule(newRule);
    loadData();
    toast({
      title: "手当ルールを作成しました",
      description: "新しい手当ルールが作成されました。",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">時給・手当設定</h1>
        <p className="text-muted-foreground">
          従業員の時給と各種手当を設定・管理します
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Employee Wage Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              従業員時給設定
            </CardTitle>
            <CardDescription>
              各従業員の基本時給を設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee-select">従業員選択</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="従業員を選択してください" />
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

            {selectedEmployee && (() => {
              const employee = employees.find(e => e.id === selectedEmployee);
              return employee ? (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{employee.name}</h3>
                      <p className="text-sm text-muted-foreground">{employee.role}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hourly-wage">基本時給 (円)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="hourly-wage"
                        type="number"
                        defaultValue={employee.hourlyWage}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (value && value !== employee.hourlyWage) {
                            handleUpdateEmployeeWage(employee.id, value);
                          }
                        }}
                      />
                      <span className="flex items-center text-sm text-muted-foreground">円/時</span>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>

        {/* Allowance Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              手当ルール設定
            </CardTitle>
            <CardDescription>
              残業、深夜、休日などの手当ルールを設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={createNewWageRule} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              新しい手当ルールを作成
            </Button>

            <Separator />

            <div className="space-y-3">
              {wageRules.map((rule) => (
                <div key={rule.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {rule.type === 'overtime' && <Clock className="h-4 w-4" />}
                      {rule.type === 'night' && <Moon className="h-4 w-4" />}
                      {rule.type === 'holiday' && <Calendar className="h-4 w-4" />}
                      <span className="font-medium">{rule.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {rule.rate}倍
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {rule.isActive ? '有効' : '無効'}
                  </div>
                </div>
              ))}
              
              {wageRules.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  手当ルールがありません
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Default Allowance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>標準手当設定</CardTitle>
          <CardDescription>
            法定手当の標準設定を管理します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="overtime-rate">残業手当率</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="overtime-rate"
                  type="number"
                  step="0.1"
                  defaultValue="1.25"
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">倍</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="night-rate">深夜手当率</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="night-rate"
                  type="number"
                  step="0.1"
                  defaultValue="1.25"
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">倍</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="holiday-rate">休日手当率</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="holiday-rate"
                  type="number"
                  step="0.1"
                  defaultValue="1.35"
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">倍</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}