import { useEffect, useMemo, useState } from 'react';
import {
    LayoutDashboard,
    MapPin,
    Package,
    DollarSign,
    Users,
    AlertTriangle,
    Calendar,
    TrendingUp,
    Utensils,
    RefreshCw,
    Clock,
} from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { inventoryApi } from '@/services/inventoryApi';
import { analyticsApi } from '@/services/analyticsApi';
import { useTables } from '@/hooks/useTables';
import type { Ingredient } from '@/types';

export function ManagerPage() {
    const navigate = useNavigate();
    const { tables, refresh: refreshTables } = useTables();

    const [tab, setTab] = useState('tables');
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [dailyRevenue, setDailyRevenue] = useState<number | null>(null);
    const [weekRevenueData, setWeekRevenueData] = useState<{ date: string; amount: number }[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadInventory = async () => {
        const items = await inventoryApi.getAll();
        setIngredients(items);
    };

    const loadDailyRevenue = async (date: string) => {
        try {
            const r = await analyticsApi.getDailyRevenue(date);
            setDailyRevenue(r.total);
        } catch {
            setDailyRevenue(null);
        }
    };

    const loadWeekRevenue = async () => {
        const dates = Array.from({ length: 7 }, (_, idx) => {
            const d = new Date();
            d.setDate(d.getDate() - idx);
            return d.toISOString().slice(0, 10);
        });
        const data = await Promise.all(
            dates.map(async date => {
                try {
                    const r = await analyticsApi.getDailyRevenue(date);
                    return { date, amount: r.total };
                } catch {
                    return { date, amount: 0 };
                }
            })
        );
        setWeekRevenueData(data);
    };

    useEffect(() => {
        if (tab === 'inventory') {
            loadInventory().catch(console.error);
        }
    }, [tab]);

    useEffect(() => {
        if (tab === 'revenue') {
            loadDailyRevenue(selectedDate).catch(console.error);
        }
    }, [tab, selectedDate]);

    useEffect(() => {
        if (tab !== 'revenue') return;
        loadWeekRevenue().catch(console.error);
    }, [tab]);

    const refreshManagerData = async () => {
        setRefreshing(true);
        try {
            await refreshTables();
            if (tab === 'inventory') {
                await loadInventory();
            }
            if (tab === 'revenue') {
                await Promise.all([loadDailyRevenue(selectedDate), loadWeekRevenue()]);
            }
        } finally {
            setRefreshing(false);
        }
    };

    const occupiedCount = tables.filter(t => t.status === 'occupied').length;
    const servedCount = tables.filter(t => t.status === 'food_ready').length;
    const emptyCount = tables.filter(t => t.status === 'available').length;

    const lowStockItems = ingredients.filter(i => i.quantity <= i.threshold);
    const totalWeekRevenue = weekRevenueData.reduce((sum, r) => sum + r.amount, 0);

    const selectedRevenue = useMemo(
        () => weekRevenueData.find(r => r.date === selectedDate) ?? (dailyRevenue !== null ? { date: selectedDate, amount: dailyRevenue } : null),
        [weekRevenueData, selectedDate, dailyRevenue]
    );

    const formatVnd = (amount: number) => `${Math.round(amount).toLocaleString('en-US')} VND`;

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <TopHeader title="Manager" icon={<LayoutDashboard className="h-5 w-5" />}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                    <Clock className="size-4" />
                    <span className="font-medium">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => void refreshManagerData()} disabled={refreshing}>
                    <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
            </TopHeader>

            <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:px-6 pb-8">
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                                    <MapPin className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{emptyCount}</p>
                                    <p className="text-xs text-muted-foreground">Empty Tables</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                                    <Users className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{occupiedCount + servedCount}</p>
                                    <p className="text-xs text-muted-foreground">Active Tables</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{lowStockItems.length}</p>
                                    <p className="text-xs text-muted-foreground">Low Stock</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{formatVnd(totalWeekRevenue)}</p>
                                    <p className="text-xs text-muted-foreground">Week Revenue</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={tab} onValueChange={setTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                        <TabsTrigger value="tables" className="gap-2 data-[state=active]:bg-card">
                            <MapPin className="h-4 w-4" />
                            <span className="hidden sm:inline">Table Map</span>
                            <span className="sm:hidden">Tables</span>
                        </TabsTrigger>
                        <TabsTrigger value="inventory" className="gap-2 data-[state=active]:bg-card">
                            <Package className="h-4 w-4" />
                            <span className="hidden sm:inline">Ingredients</span>
                            <span className="sm:hidden">Stock</span>
                        </TabsTrigger>
                        <TabsTrigger value="revenue" className="gap-2 data-[state=active]:bg-card">
                            <DollarSign className="h-4 w-4" />
                            <span>Revenue</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tables" className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    Floor Plan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                        <span className="text-muted-foreground">Empty ({emptyCount})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                                        <span className="text-muted-foreground">Occupied ({occupiedCount})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                                        <span className="text-muted-foreground">Served ({servedCount})</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                                    {tables.map(table => (
                                        <div
                                            key={table.id}
                                            className={cn(
                                                'flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all',
                                                table.status === 'available' && 'border-emerald-200 bg-emerald-50',
                                                table.status === 'occupied' && 'border-amber-200 bg-amber-50',
                                                table.status === 'food_ready' && 'border-blue-200 bg-blue-50'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'mb-2 flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold text-white',
                                                    table.status === 'available' && 'bg-emerald-500',
                                                    table.status === 'occupied' && 'bg-amber-500',
                                                    table.status === 'food_ready' && 'bg-blue-500'
                                                )}
                                            >
                                                {table.tableNumber}
                                            </div>
                                            <p className="text-xs font-medium capitalize text-foreground">
                                                {table.status === 'available'
                                                    ? 'empty'
                                                    : table.status === 'food_ready'
                                                      ? 'served'
                                                      : 'occupied'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="inventory" className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Package className="h-5 w-5 text-primary" />
                                    Ingredients Inventory
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="font-semibold">Ingredient</TableHead>
                                                <TableHead className="text-right font-semibold">Quantity</TableHead>
                                                <TableHead className="font-semibold">Unit</TableHead>
                                                <TableHead className="text-right font-semibold">Threshold</TableHead>
                                                <TableHead className="text-center font-semibold">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ingredients.map(ingredient => {
                                                const isLowStock = ingredient.quantity <= ingredient.threshold;
                                                return (
                                                    <TableRow key={ingredient.id} className={cn(isLowStock && 'bg-red-50')}>
                                                        <TableCell className="font-medium">{ingredient.name}</TableCell>
                                                        <TableCell
                                                            className={cn(
                                                                'text-right tabular-nums',
                                                                isLowStock && 'font-semibold text-red-600'
                                                            )}
                                                        >
                                                            {ingredient.quantity}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">{ingredient.unit}</TableCell>
                                                        <TableCell className="text-right tabular-nums text-muted-foreground">
                                                            {ingredient.threshold}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {isLowStock ? (
                                                                <Badge variant="destructive" className="gap-1">
                                                                    <AlertTriangle className="h-3 w-3" />
                                                                    Low
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="bg-emerald-100 text-emerald-700"
                                                                >
                                                                    OK
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="revenue" className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Daily Revenue
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        Select Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={selectedDate}
                                        onChange={e => setSelectedDate(e.target.value)}
                                        className="w-full sm:w-auto"
                                    />
                                </div>

                                {selectedRevenue ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Card className="border-2 border-primary/20 bg-primary/5">
                                            <CardContent className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary">
                                                        <DollarSign className="h-7 w-7 text-primary-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                                                        <p className="text-3xl font-bold text-foreground">
                                                            {formatVnd(selectedRevenue.amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                                        <TrendingUp className="h-7 w-7 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Data source</p>
                                                        <p className="text-lg font-bold text-foreground">Analytics API</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted py-12">
                                        <Calendar className="mb-3 h-10 w-10 text-muted-foreground/50" />
                                        <p className="text-muted-foreground">No data available for selected date</p>
                                    </div>
                                )}

                                <div>
                                    <h3 className="mb-3 text-sm font-semibold text-foreground">Recent 7 Days</h3>
                                    <div className="space-y-2">
                                        {weekRevenueData.map(day => (
                                            <button
                                                key={day.date}
                                                onClick={() => setSelectedDate(day.date)}
                                                className={cn(
                                                    'flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all hover:bg-muted/50 cursor-pointer',
                                                    selectedDate === day.date && 'border-primary bg-primary/5'
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            'h-2 w-2 rounded-full',
                                                            day.amount >= 10_000_000
                                                                ? 'bg-emerald-500'
                                                                : day.amount >= 5_000_000
                                                                  ? 'bg-amber-500'
                                                                  : 'bg-muted-foreground'
                                                        )}
                                                    />
                                                    <span className="text-sm font-medium text-foreground">
                                                        {new Date(day.date).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {formatVnd(day.amount)}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
