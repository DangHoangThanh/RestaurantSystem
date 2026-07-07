import { getOrderDetails, createBill, getPendingBillByTable, markBillAsPaid } from './repository';
import { eventBus } from '../../infrastructure/eventBus';
import { EventName, OrderCompletedPayload } from '../../shared/events';

export const fetchPendingBill = async (tableId: string) => {
  return await getPendingBillByTable(tableId);
};

export const payBill = async (billId: string) => {
  const bill = await markBillAsPaid(billId);
  if (bill) {
    eventBus.emit(EventName.PAYMENT_COMPLETED, {
      billId: bill.id,
      tableId: bill.table_id,
      amount: bill.total_amount
    });
  }
  return bill;
};

export const initBillingSubscribers = () => {
  eventBus.on(EventName.ORDER_COMPLETED, async (payload: OrderCompletedPayload) => {
    try {
      const order = await getOrderDetails(payload.orderId);
      if (order) {
        await createBill(payload.orderId, order.table_id, order.total_price);
      }
    } catch (err) {
      console.error('Error creating bill', err);
    }
  });
};
