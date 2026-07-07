import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useKitchen } from '@/hooks/useKitchen';
import type { KitchenTicket } from '@/types';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    ChefHat,
    Clock,
    Flame,
    Timer,
    UtensilsCrossed,
} from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';
import { toast } from '@/lib/toast';

function formatTimeAgo(createdAt: string): string {
    const created = new Date(createdAt).getTime();
    if (Number.isNaN(created)) return 'Just now';
    const minutes = Math.floor((Date.now() - created) / 1000 / 60);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
}

type OrderCardProps = {
    ticket: KitchenTicket;
    onMoveToNext: (ticketId: string) => void;
};

function OrderCard({ ticket, onMoveToNext }: OrderCardProps) {
    const [timeAgo, setTimeAgo] = useState(formatTimeAgo(ticket.createdAt));

    useEffect(() => {
        setTimeAgo(formatTimeAgo(ticket.createdAt));
        const id = setInterval(() => setTimeAgo(formatTimeAgo(ticket.createdAt)), 30000);
        return () => clearInterval(id);
    }, [ticket.createdAt]);

    const isUrgent =
        ticket.status === 'pending' &&
        Date.now() - new Date(ticket.createdAt).getTime() > 1000 * 60 * 10;

    return (
        <Card
            className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                isUrgent ? 'ring-2 ring-destructive/50' : ''
            }`}
        >
            {isUrgent && <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />}
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <span className="font-mono text-primary">Order ID {ticket.orderId.slice(0, 8)}</span>
                            {isUrgent && <AlertCircle className="size-4 animate-pulse text-destructive" />}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="font-medium">
                                Table {ticket.tableId}
                            </Badge>
                            <span className="flex items-center gap-1">
                                <Timer className="size-3" />
                                {timeAgo}
                            </span>
                        </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary">
                        {ticket.quantity} {ticket.quantity === 1 ? 'item' : 'items'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">
                            {ticket.quantity}x {ticket.comboName}
                        </span>
                    </div>
                </div>

                {ticket.notes && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-sm text-foreground/80">
                            <span className="font-medium text-primary">Note:</span> {ticket.notes}
                        </p>
                    </div>
                )}

                <Button
                    onClick={() => onMoveToNext(ticket.id)}
                    className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {ticket.status === 'pending' ? (
                        <>
                            <Flame className="size-4" />
                            Start Cooking
                            <ArrowRight className="size-4" />
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="size-4" />
                            Mark as Ready
                            <ArrowRight className="size-4" />
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}

export function KitchenPage() {
    const { tickets, startCooking, markDone } = useKitchen();

    const waitingOrders = useMemo(
        () =>
            tickets
                .filter(t => t.status === 'pending')
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        [tickets]
    );
    const cookingOrders = useMemo(
        () =>
            tickets
                .filter(t => t.status === 'cooking')
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        [tickets]
    );

    const moveToNextStatus = async (ticketId: string) => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return;
        try {
            if (ticket.status === 'pending') {
                await startCooking(ticketId);
                toast.fire({ icon: 'success', title: 'Order is now cooking' });
                return;
            }
            if (ticket.status === 'cooking') {
                await markDone(ticketId);
                toast.fire({ icon: 'success', title: 'Order marked as ready' });
            }
        } catch (err) {
            toast.fire({ icon: 'error', title: 'Action failed' });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <TopHeader title="Kitchen" icon={<ChefHat className="size-5" />}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                    <Clock className="size-4" />
                    <span className="font-medium">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </TopHeader>

            <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:px-6">
                <div className="grid gap-6 lg:grid-cols-2">
                    <section>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                <Clock className="size-4" />
                            </div>
                            <div>
                                <h2 className="font-semibold">Waiting to Cook</h2>
                                <p className="text-xs text-muted-foreground">
                                    {waitingOrders.length} {waitingOrders.length === 1 ? 'order' : 'orders'} in queue
                                </p>
                            </div>
                        </div>
                        <div className="h-[calc(100vh-220px)] overflow-y-auto pr-2">
                            <div className="space-y-4 pr-2">
                                {waitingOrders.length === 0 ? (
                                    <Card className="border-dashed">
                                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                            <UtensilsCrossed className="mb-3 size-12 text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">No orders waiting</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    waitingOrders.map(ticket => (
                                        <OrderCard key={ticket.id} ticket={ticket} onMoveToNext={moveToNextStatus} />
                                    ))
                                )}
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                                <Flame className="size-4" />
                            </div>
                            <div>
                                <h2 className="font-semibold">Now Cooking</h2>
                                <p className="text-xs text-muted-foreground">
                                    {cookingOrders.length} {cookingOrders.length === 1 ? 'order' : 'orders'} in progress
                                </p>
                            </div>
                        </div>
                        <div className="h-[calc(100vh-220px)] overflow-y-auto pr-2">
                            <div className="space-y-4 pr-2">
                                {cookingOrders.length === 0 ? (
                                    <Card className="border-dashed">
                                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                            <Flame className="mb-3 size-12 text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">Nothing cooking right now</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    cookingOrders.map(ticket => (
                                        <OrderCard key={ticket.id} ticket={ticket} onMoveToNext={moveToNextStatus} />
                                    ))
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
