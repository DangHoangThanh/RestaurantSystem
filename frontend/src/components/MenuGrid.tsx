import type { MenuItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
    menu: MenuItem[];
    onSelect: (item: MenuItem) => void;
};

export function MenuGrid({ menu, onSelect }: Props) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {menu.map(item => (
                <Card key={item.id} className={!item.isAvailable ? 'opacity-50' : ''}>
                    <CardContent className="p-4">
                        <Button
                            disabled={!item.isAvailable}
                            onClick={() => onSelect(item)}
                            variant="outline"
                            className={`h-auto w-full justify-start p-4 text-left whitespace-normal border-transparent shadow-sm ${
                                item.isAvailable ? 'bg-card hover:bg-muted/50 cursor-pointer' : 'bg-muted cursor-not-allowed'
                            }`}
                        >
                            <div className="flex flex-col gap-1 w-full">
                                <div className="font-semibold text-base leading-tight">{item.name}</div>
                                <div className="text-muted-foreground text-sm">
                                    {item.price.toLocaleString('en-US')} VND
                                </div>
                                {!item.isAvailable && (
                                    <div className="mt-1">
                                        <Badge variant="destructive">
                                            Sold out
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}