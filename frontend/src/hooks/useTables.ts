import { useCallback, useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Table } from '@/types';

export function useTables() {
    const [tables, setTables] = useState<Table[]>([]);
    const refresh = useCallback(async () => {
        const response = await api.get<Table[]>('/tables');
        setTables(response.data);
    }, []);

    useEffect(() => {
        refresh().catch(console.error);
        const id = setInterval(() => refresh().catch(console.error), 3000);
        return () => clearInterval(id);
    }, [refresh]);
    return { tables, refresh };
}