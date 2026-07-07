import { useState } from 'react';
import { billingApi } from '@/services/billingApi';
import type { Bill } from '@/types';

export function useBilling() {
    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchBill = async (tableId: string): Promise<Bill> => {
        setLoading(true);
        try {
            const b = await billingApi.getBillByTable(tableId);
            setBill(b);
            return b;
        } finally { setLoading(false); }
    };

    const pay = async (billId: string): Promise<Bill> => {
        const paid = await billingApi.pay(billId);
        setBill(paid);
        return paid;
    };

    return { bill, loading, fetchBill, pay };
}