import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Employee } from '@/types';
import { database } from '@/lib/database';
import { toast } from 'sonner';
import dayjs from '@/utils/dayjs';

const employeeFormSchema = z.object({
  code: z.string().min(1, '従業員コードは必須です'),
  name: z.string().min(1, '氏名は必須です'),
  email: z.string().email('正しいメールアドレスを入力してください').optional().or(z.literal('')),
  role: z.string().min(1, '役職は必須です'),
  department: z.string().min(1, '部署は必須です'),
  hourlyWage: z.number().min(0, '時給は0円以上で入力してください'),
  hireDate: z.string().min(1, '入社日は必須です'),
  status: z.enum(['active', 'inactive']),
  workStartTime: z.string().optional(),
  workEndTime: z.string().optional(),
  payDay: z.number().min(1).max(31).optional()
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const roleOptions = [
  '店長',
  '副店長',
  '主任',
  '正社員',
  'パート',
  'アルバイト'
];

const departmentOptions = [
  '販売部',
  '管理部',
  '営業部',
  '製造部',
  'その他'
];

export function EmployeeDialog({ employee, open, onOpenChange, onSave }: EmployeeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      code: '',
      name: '',
      email: '',
      role: '',
      department: '',
      hourlyWage: 1000,
      hireDate: dayjs().format('YYYY-MM-DD'),
      status: 'active',
      workStartTime: '09:00',
      workEndTime: '18:00',
      payDay: 25
    }
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        code: employee.code,
        name: employee.name,
        email: employee.email || '',
        role: employee.role,
        department: employee.department,
        hourlyWage: employee.hourlyWage,
        hireDate: employee.hireDate,
        status: employee.status
      });
    } else {
      form.reset({
        code: '',
        name: '',
        email: '',
        role: '',
        department: '',
        hourlyWage: 1000,
        hireDate: dayjs().format('YYYY-MM-DD'),
        status: 'active'
      });
    }
  }, [employee, form]);

  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true);
    try {
      const formattedData = {
        ...data,
        email: data.email || undefined
      };

      if (employee) {
        // Update existing employee
        database.updateEmployee(employee.id, formattedData);
        toast.success('従業員情報を更新しました');
      } else {
        // Create new employee
        database.createEmployee(formattedData);
        toast.success('新しい従業員を登録しました');
      }
      
      onSave();
    } catch (error) {
      console.error('従業員の保存に失敗しました:', error);
      toast.error('従業員の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {employee ? '従業員情報編集' : '新規従業員登録'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>従業員コード *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="EMP001" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>氏名 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="田中 太郎" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="example@company.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>役職 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="役職を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>部署 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="部署を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departmentOptions.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hourlyWage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>時給 *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min="0"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        placeholder="1000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>入社日 *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ステータス *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">在籍</SelectItem>
                        <SelectItem value="inactive">退職</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '保存中...' : employee ? '更新' : '登録'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}