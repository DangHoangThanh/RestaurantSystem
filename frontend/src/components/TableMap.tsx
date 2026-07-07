import { useTables } from '@/hooks/useTables';
import type { TableStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const colorMap: Record<TableStatus, string> = {
    available: 'bg-emerald-600',
    occupied: 'bg-orange-500',
    food_ready: 'bg-blue-600',
};
const labelMap: Record<TableStatus, string> = {
    available: 'Empty',
    occupied: 'Occupied',
    food_ready: 'Served',
};

export function TableMap() {
    const { tables } = useTables();

    return (
        <div>
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
                {Object.entries(colorMap).map(([status, color]) => (
                    <Badge key={status} variant="outline" className="flex items-center gap-2 font-normal">
                        <span className={`w-3 h-3 rounded-sm inline-block ${color}`} />
                        {labelMap[status as TableStatus]}
                    </Badge>
                ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {tables.map(table => (
                    <Card key={table.id} className={`${colorMap[table.status]} text-white border-none shadow-md`}>
                        <CardContent className="p-4 text-center font-medium">
                            <div className="text-lg">Table {table.tableNumber}</div>
                            <div className="text-xs opacity-90 mt-1">
                                {labelMap[table.status]}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
