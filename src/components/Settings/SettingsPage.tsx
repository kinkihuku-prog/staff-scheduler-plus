import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Settings, Calendar, DollarSign, Clock, Database, Shield } from 'lucide-react';

interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  businessHours: {
    start: string;
    end: string;
  };
  holidays: string[];
  monthlyBudget: number;
}

interface SystemSettings {
  timeRounding: number; // minutes
  overtimeThreshold: number; // hours
  nightShiftStart: string;
  nightShiftEnd: string;
  autoBackup: boolean;
  backupFrequency: string;
}

export function SettingsPage() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: '',
    address: '',
    phone: '',
    businessHours: {
      start: '09:00',
      end: '18:00'
    },
    holidays: [],
    monthlyBudget: 0
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    timeRounding: 15,
    overtimeThreshold: 8,
    nightShiftStart: '22:00',
    nightShiftEnd: '05:00',
    autoBackup: true,
    backupFrequency: 'daily'
  });

  const [newHoliday, setNewHoliday] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    // Load settings from localStorage or database
    const savedStoreSettings = localStorage.getItem('storeSettings');
    const savedSystemSettings = localStorage.getItem('systemSettings');
    
    if (savedStoreSettings) {
      setStoreSettings(JSON.parse(savedStoreSettings));
    }
    
    if (savedSystemSettings) {
      setSystemSettings(JSON.parse(savedSystemSettings));
    }
  };

  const saveStoreSettings = () => {
    localStorage.setItem('storeSettings', JSON.stringify(storeSettings));
    toast({
      title: "設定を保存しました",
      description: "店舗設定が正常に保存されました。",
    });
  };

  const saveSystemSettings = () => {
    localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
    toast({
      title: "設定を保存しました",
      description: "システム設定が正常に保存されました。",
    });
  };

  const addHoliday = () => {
    if (newHoliday && !storeSettings.holidays.includes(newHoliday)) {
      setStoreSettings(prev => ({
        ...prev,
        holidays: [...prev.holidays, newHoliday]
      }));
      setNewHoliday('');
    }
  };

  const removeHoliday = (holiday: string) => {
    setStoreSettings(prev => ({
      ...prev,
      holidays: prev.holidays.filter(h => h !== holiday)
    }));
  };

  const exportData = () => {
    // Export all data as JSON
    const data = {
      employees: JSON.parse(localStorage.getItem('employees') || '[]'),
      timeRecords: JSON.parse(localStorage.getItem('timeRecords') || '[]'),
      shifts: JSON.parse(localStorage.getItem('shifts') || '[]'),
      wageRules: JSON.parse(localStorage.getItem('wageRules') || '[]'),
      storeSettings,
      systemSettings
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `timeclock_backup_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "データエクスポート完了",
      description: "全データをバックアップファイルとしてダウンロードしました。",
    });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Restore data to localStorage
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'storeSettings') {
            setStoreSettings(value as StoreSettings);
          } else if (key === 'systemSettings') {
            setSystemSettings(value as SystemSettings);
          }
          localStorage.setItem(key, JSON.stringify(value));
        });
        
        toast({
          title: "データインポート完了",
          description: "バックアップファイルからデータを復元しました。",
        });
      } catch (error) {
        toast({
          title: "インポートエラー",
          description: "ファイルの読み込みに失敗しました。",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">設定</h1>
        <p className="text-muted-foreground">
          システムと店舗の各種設定を管理します
        </p>
      </div>

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="store">店舗設定</TabsTrigger>
          <TabsTrigger value="system">システム設定</TabsTrigger>
          <TabsTrigger value="holidays">休日設定</TabsTrigger>
          <TabsTrigger value="backup">バックアップ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="store" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                店舗基本情報
              </CardTitle>
              <CardDescription>
                店舗の基本情報と営業時間を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="store-name">店舗名</Label>
                  <Input
                    id="store-name"
                    value={storeSettings.storeName}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, storeName: e.target.value }))}
                    placeholder="店舗名を入力"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">電話番号</Label>
                  <Input
                    id="phone"
                    value={storeSettings.phone}
                    onChange={(e) => setStoreSettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="電話番号を入力"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">住所</Label>
                <Textarea
                  id="address"
                  value={storeSettings.address}
                  onChange={(e) => setStoreSettings(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="住所を入力"
                  rows={2}
                />
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">営業時間</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="business-start">開店時間</Label>
                    <Input
                      id="business-start"
                      type="time"
                      value={storeSettings.businessHours.start}
                      onChange={(e) => setStoreSettings(prev => ({
                        ...prev,
                        businessHours: { ...prev.businessHours, start: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business-end">閉店時間</Label>
                    <Input
                      id="business-end"
                      type="time"
                      value={storeSettings.businessHours.end}
                      onChange={(e) => setStoreSettings(prev => ({
                        ...prev,
                        businessHours: { ...prev.businessHours, end: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="monthly-budget">月間人件費予算 (円)</Label>
                <Input
                  id="monthly-budget"
                  type="number"
                  value={storeSettings.monthlyBudget}
                  onChange={(e) => setStoreSettings(prev => ({ ...prev, monthlyBudget: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              
              <Button onClick={saveStoreSettings}>
                店舗設定を保存
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                時間管理設定
              </CardTitle>
              <CardDescription>
                時間の丸め処理や残業の設定を行います
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="time-rounding">時間丸め処理 (分)</Label>
                  <Input
                    id="time-rounding"
                    type="number"
                    value={systemSettings.timeRounding}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, timeRounding: parseInt(e.target.value) || 15 }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    打刻時間を指定した分単位で丸めます
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overtime-threshold">残業開始時間 (時間)</Label>
                  <Input
                    id="overtime-threshold"
                    type="number"
                    value={systemSettings.overtimeThreshold}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, overtimeThreshold: parseInt(e.target.value) || 8 }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    この時間を超えると残業扱いになります
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">深夜勤務時間帯</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="night-start">深夜開始時間</Label>
                    <Input
                      id="night-start"
                      type="time"
                      value={systemSettings.nightShiftStart}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, nightShiftStart: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="night-end">深夜終了時間</Label>
                    <Input
                      id="night-end"
                      type="time"
                      value={systemSettings.nightShiftEnd}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, nightShiftEnd: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={saveSystemSettings}>
                システム設定を保存
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="holidays" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                店休日設定
              </CardTitle>
              <CardDescription>
                定休日や特別休業日を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newHoliday}
                  onChange={(e) => setNewHoliday(e.target.value)}
                  placeholder="休日を選択"
                />
                <Button onClick={addHoliday}>追加</Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">設定済み休日</h4>
                <div className="grid gap-2 md:grid-cols-3">
                  {storeSettings.holidays.map((holiday) => (
                    <div key={holiday} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{holiday}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHoliday(holiday)}
                      >
                        削除
                      </Button>
                    </div>
                  ))}
                </div>
                
                {storeSettings.holidays.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    設定された休日がありません
                  </p>
                )}
              </div>
              
              <Button onClick={saveStoreSettings}>
                休日設定を保存
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  データエクスポート
                </CardTitle>
                <CardDescription>
                  全てのデータをバックアップファイルとしてダウンロードします
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={exportData} className="w-full">
                  データをエクスポート
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  データインポート
                </CardTitle>
                <CardDescription>
                  バックアップファイルからデータを復元します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  JSONファイルを選択してください
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>自動バックアップ設定</CardTitle>
              <CardDescription>
                定期的な自動バックアップの設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-backup"
                  checked={systemSettings.autoBackup}
                  onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, autoBackup: checked }))}
                />
                <Label htmlFor="auto-backup">自動バックアップを有効にする</Label>
              </div>
              
              {systemSettings.autoBackup && (
                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">バックアップ頻度</Label>
                  <select
                    id="backup-frequency"
                    value={systemSettings.backupFrequency}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="daily">毎日</option>
                    <option value="weekly">毎週</option>
                    <option value="monthly">毎月</option>
                  </select>
                </div>
              )}
              
              <Button onClick={saveSystemSettings}>
                バックアップ設定を保存
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}