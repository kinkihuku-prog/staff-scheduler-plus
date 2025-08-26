import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Employee } from '@/types';
import { database } from '@/lib/database';
import { cn } from '@/lib/utils';

interface EmployeeSelectorProps {
  selectedEmployeeId?: string;
  onSelect: (employee: Employee) => void;
}

export function EmployeeSelector({ selectedEmployeeId, onSelect }: EmployeeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const loadEmployees = () => {
      const data = database.getEmployees().filter(emp => emp.status === 'active');
      setEmployees(data);
      
      if (selectedEmployeeId) {
        const selected = data.find(emp => emp.id === selectedEmployeeId);
        setSelectedEmployee(selected || null);
      }
    };

    loadEmployees();
  }, [selectedEmployeeId]);

  const handleSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setOpen(false);
    onSelect(employee);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedEmployee ? (
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>{selectedEmployee.name}</span>
              <span className="text-xs text-muted-foreground">
                ({selectedEmployee.code})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User size={16} />
              <span>従業員を選択してください</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="従業員を検索..." />
          <CommandList>
            <CommandEmpty>従業員が見つかりません</CommandEmpty>
            <CommandGroup>
              {employees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={`${employee.name} ${employee.code}`}
                  onSelect={() => handleSelect(employee)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedEmployee?.id === employee.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {employee.code} • {employee.role}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {employee.hourlyWage}円/時
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}