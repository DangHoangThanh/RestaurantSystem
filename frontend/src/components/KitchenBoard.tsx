import { useKitchen } from '@/hooks/useKitchen';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat } from 'lucide-react';

export function KitchenBoard() {
    const { tickets, startCooking, markDone } = useKitchen();

    const pending = tickets.filter(t => t.status === 'pending');
    const cooking = tickets.filter(t => t.status === 'cooking');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-orange-600 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Pending
                    </h3>
                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                        {pending.length}
                    </Badge>
                </div>
                <div className="space-y-3">
                    {pending.map(t => (
                        <Card key={t.id} className="border-l-4 border-l-orange-500 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-lg">Table {t.tableId}</div>
                                    <Badge variant="secondary" className="font-mono">{t.quantity}x</Badge>
                                </div>
                                <div className="font-medium text-foreground mb-1">{t.comboName}</div>
                                {t.notes && <div className="text-muted-foreground text-sm italic mb-3">"{t.notes}"</div>}
                                <Button
                                    onClick={() => startCooking(t.id)}
                                    className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                    Start cooking
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    {pending.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                            No pending tickets
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-emerald-600 flex items-center gap-2">
                        <ChefHat className="w-5 h-5" />
                        Cooking
                    </h3>
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        {cooking.length}
                    </Badge>
                </div>
                <div className="space-y-3">
                    {cooking.map(t => (
                        <Card key={t.id} className="border-l-4 border-l-emerald-500 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-bold text-lg">Table {t.tableId}</div>
                                    <Badge variant="secondary" className="font-mono">{t.quantity}x</Badge>
                                </div>
                                <div className="font-medium text-foreground mb-1">{t.comboName}</div>
                                {t.notes && <div className="text-muted-foreground text-sm italic mb-3">"{t.notes}"</div>}
                                <Button
                                    onClick={() => markDone(t.id)}
                                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    Finish
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    {cooking.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                            No active tickets
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
