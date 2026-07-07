import { useState, useEffect } from 'react';
import { analyticsApi } from '@/services/analyticsApi';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function RevenueChart() {
    const today = new Date().toISOString().slice(0, 10);
    const [total, setTotal] = useState<number | null>(null);
    const [date, setDate] = useState(today);

    useEffect(() => {
        analyticsApi.getDailyRevenue(date)
            .then(d => setTotal(d.total))
            .catch(console.error);
    }, [date]);

    return (
        <Card className="max-w-sm">
            <CardContent className="p-6">
                <div className="mb-3 text-sm text-muted-foreground font-medium">Daily Revenue</div>
                <Input
                    type="date" value={date}
                    onChange={e => setDate(e.target.value)}
                    className="mb-4"
                />
                <div className="text-4xl font-bold text-foreground">
                    {total === null ? '...' : `${total.toLocaleString('en-US')} VND`}
                </div>
            </CardContent>
        </Card>
    );
}