import { useState } from 'react';
import { useBilling } from '@/hooks/useBilling';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function BillPanel() {
    const { bill, loading, fetchBill, pay } = useBilling();
    const [tableInput, setTableInput] = useState('');

    return (
        <div className="max-w-sm flex flex-col gap-4">
            <div className="flex gap-2">
                <Input
                    placeholder="Table number..."
                    value={tableInput}
                    onChange={e => setTableInput(e.target.value)}
                    className="flex-1"
                />
                <Button onClick={() => fetchBill(tableInput)}>
                    Search
                </Button>
            </div>

            {loading && <div className="text-muted-foreground animate-pulse p-2">Loading...</div>}

            {bill && (
                <Card>
                    <CardContent className="p-6">
                        <CardTitle className="text-lg font-medium mb-2">
                            Table {bill.tableId} bill
                        </CardTitle>
                        <div className="text-3xl font-bold text-foreground mb-4">
                            {bill.totalAmount.toLocaleString('en-US')} VND
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                            Status: <span className={`font-semibold ${bill.status === 'paid' ? 'text-success' : 'text-amber-600'}`}>{bill.status === 'paid' ? 'Paid' : 'Unpaid'}</span>
                        </div>

                        {bill.status === 'pending' && (
                            <Button
                                onClick={() => pay(bill.id)}
                                className="w-full py-6 text-base bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                Confirm payment
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}