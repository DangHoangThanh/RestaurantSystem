import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useMenu } from '@/hooks/useMenu';
import { useTables } from '@/hooks/useTables';
import { orderApi } from '@/services/orderApi';
import type { CreateOrderDto, MenuItem, Table, TableStatus } from '@/types';
import { TopHeader } from '@/components/TopHeader';
import { UtensilsCrossed, MapPin, Clock } from 'lucide-react';
import { toast } from '@/lib/toast';

const TABS = [
    { key: 'order', label: 'Menu' },
    { key: 'tables', label: 'Tables' },
];

const statusLabel: Record<TableStatus, string> = {
    available: 'Empty',
    occupied: 'Occupied',
    food_ready: 'Served',
};

const statusClass: Record<TableStatus, string> = {
    available: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    occupied: 'bg-amber-100 text-amber-700 ring-amber-200',
    food_ready: 'bg-sky-100 text-sky-700 ring-sky-200',
};

export function ServerPage() {
    const [tab, setTab] = useState('order');
    const [searchQuery, setSearchQuery] = useState('');
    const [cartOpen, setCartOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [tableId, setTableId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const { menu, loading } = useMenu();
    const { tables } = useTables();

    const filteredMenu = useMemo(() => {
        if (!searchQuery.trim()) return menu;
        const query = searchQuery.toLowerCase();
        return menu.filter(
            item =>
                item.name.toLowerCase().includes(query) ||
                item.price.toString().includes(query)
        );
    }, [menu, searchQuery]);

    const subtotal = selectedItem ? selectedItem.price * quantity : 0;
    const formatVnd = (amount: number) => `${Math.round(amount).toLocaleString('en-US')} VND`;

    const openOrderSheet = (menuItem: MenuItem) => {
        setSelectedItem(menuItem);
        setQuantity(1);
        setNotes('');
        setCartOpen(true);
    };

    const placeOrder = async () => {
        if (!selectedItem || !tableId) return;
        setStatus('loading');
        try {
            const dto: CreateOrderDto = {
                tableId,
                comboId: selectedItem.id,
                quantity: Math.max(1, quantity),
                notes,
            };
            await orderApi.createOrder(dto);
            toast.fire({ icon: 'success', title: 'Order placed successfully!' });
            setStatus('success');
            setSelectedItem(null);
            setTableId('');
            setQuantity(1);
            setNotes('');
            setCartOpen(false);
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {
            toast.fire({ icon: 'error', title: 'Failed to place order' });
            setStatus('idle');
        }
    };

    return (
        <div className="flex min-h-screen flex-col">
            <TopHeader
                title="Server"
                icon={<UtensilsCrossed className="h-5 w-5" />}
                centerContent={
                    <div className="flex w-full max-w-sm items-center gap-2">
                        <Input
                            placeholder="Search menu..."
                            aria-label="Search menu"
                            className="h-9 rounded-xl bg-background/80"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                }
            >
                <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                    <Clock className="size-4" />
                    <span className="font-medium">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </TopHeader>

            <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:px-6">
                <Tabs value={tab} onValueChange={setTab} className="h-full">
                    <div className="sticky top-[58px] z-20 border-b bg-background/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                        <TabsList className="mx-auto grid h-9 w-full max-w-md grid-cols-2 rounded-xl">
                            {TABS.map(t => (
                                <TabsTrigger key={t.key} value={t.key} className="gap-2 rounded-lg text-sm">
                                    {t.key === 'order' ? (
                                        <UtensilsCrossed className="h-4 w-4" />
                                    ) : (
                                        <MapPin className="h-4 w-4" />
                                    )}
                                    <span>{t.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <TabsContent value="order" className="mt-4">
                        {loading ? (
                            <div className="py-10 text-center text-muted-foreground">Loading menu...</div>
                        ) : filteredMenu.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="mb-3 rounded-full bg-muted p-4">
                                    <UtensilsCrossed className="h-7 w-7 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground">No items found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                                {filteredMenu.map(item => (
                                    <Card
                                        key={item.id}
                                        className="overflow-hidden rounded-2xl transition hover:shadow-sm"
                                    >
                                        <div className="flex h-28 items-center justify-center bg-orange-50 text-3xl font-bold text-orange-200">
                                            {item.name.charAt(0).toUpperCase()}
                                        </div>
                                        <CardContent className="space-y-2 p-3">
                                            <div className="line-clamp-1 text-sm font-semibold">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {item.isAvailable ? 'Available' : 'Out of stock'}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-semibold text-orange-600">
                                                    {formatVnd(item.price)}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    disabled={!item.isAvailable}
                                                    onClick={() => openOrderSheet(item)}
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="tables" className="mt-4">
                        <div className="mb-4">
                            <h3 className="text-base font-semibold">Table Overview</h3>
                            <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                    Empty
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                                    Occupied
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                                    Served
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                            {tables.map((table: Table) => {
                                const isSelected = tableId === table.tableNumber;
                                return (
                                    <button
                                        key={table.id}
                                        type="button"
                                        onClick={() => setTableId(table.tableNumber)}
                                        className={`rounded-xl border p-6 text-center ring-1 transition cursor-pointer ${
                                            statusClass[table.status]
                                        } ${isSelected ? 'ring-2 ring-foreground' : ''}`}
                                    >
                                        <div className="text-2xl font-bold">{table.tableNumber}</div>
                                        <div className="mt-2 text-xs">{statusLabel[table.status]}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetContent className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Current Order</SheetTitle>
                        <SheetDescription>{selectedItem ? '1 item selected' : 'No item selected'}</SheetDescription>
                    </SheetHeader>

                    <div className="space-y-3 overflow-y-auto px-4">
                        {!selectedItem ? (
                            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                                Select a menu item to start ordering
                            </div>
                        ) : (
                            <Card className="rounded-xl">
                                <CardContent className="space-y-2 p-3">
                                    <div>
                                        <div className="text-sm font-medium">{selectedItem.name}</div>
                                        <div className="text-xs text-orange-600">
                                            {formatVnd(selectedItem.price)}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium">Quantity</div>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={quantity}
                                            onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Select Table</div>
                            <div className="grid grid-cols-5 gap-2">
                                {tables.map((table: Table) => (
                                    <Button
                                        key={table.id}
                                        type="button"
                                        variant={tableId === table.tableNumber ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setTableId(table.tableNumber)}
                                    >
                                        {table.tableNumber}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Order Notes</div>
                            <Textarea
                                placeholder="Special requests, allergies..."
                                rows={3}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <SheetFooter className="border-t">
                        <div className="w-full space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Subtotal</span>
                                <span>{formatVnd(subtotal)}</span>
                            </div>
                            <Button
                                className="w-full"
                                disabled={!selectedItem || !tableId || status === 'loading'}
                                onClick={placeOrder}
                            >
                                {status === 'loading'
                                    ? 'Sending...'
                                    : status === 'success'
                                      ? 'Order created!'
                                      : 'Create Order'}
                            </Button>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}