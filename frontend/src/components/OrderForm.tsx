import { useState } from 'react';
import { orderApi } from '@/services/orderApi';
import { MenuGrid } from '@/components/MenuGrid';
import { useMenu } from '@/hooks/useMenu';
import type { MenuItem, CreateOrderDto } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function OrderForm() {
    const { menu, loading } = useMenu();
    const [selected, setSelected] = useState<MenuItem | null>(null);
    const [tableId, setTableId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const submit = async () => {
        if (!selected || !tableId) return;
        setStatus('loading');
        try {
            const dto: CreateOrderDto = {
                tableId, comboId: selected.id, quantity, notes,
            };
            await orderApi.createOrder(dto);
            setStatus('success');
            setSelected(null); setTableId(''); setQuantity(1); setNotes('');
            setTimeout(() => setStatus('idle'), 2000);
        } catch { setStatus('idle'); }
    };

    if (loading) return <div className="p-4 text-muted-foreground text-center animate-pulse">Loading menu...</div>;

    return (
        <div className="flex flex-col gap-4">
            <MenuGrid menu={menu} onSelect={setSelected} />

            {selected && (
                <Card className="bg-success/15 border-success/30">
                    <CardContent className="p-4 text-sm">
                        <strong className="text-success-foreground">Selected:</strong>{' '}
                        <span className="font-medium">{selected.name}</span> —{' '}
                        {selected.price.toLocaleString('en-US')} VND
                    </CardContent>
                </Card>
            )}

            <div className="flex gap-2">
                <Input
                    placeholder="Table number (e.g. 001)"
                    value={tableId}
                    onChange={e => setTableId(e.target.value)}
                    className="flex-1"
                />
                <Input
                    type="number" min={1} value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-[80px]"
                />
            </div>

            <Textarea
                placeholder="Notes (no spicy, allergies...)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="resize-none"
            />

            <Button
                onClick={submit}
                disabled={!selected || !tableId || status === 'loading'}
                className={`w-full py-6 text-base ${status === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            >
                {status === 'loading' ? 'Sending...' :
                    status === 'success' ? 'Order created!' : 'Create Order'}
            </Button>
        </div>
    );
}