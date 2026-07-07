import { getAllTables, updateTableStatusByNumber, getTableNumberByOrderId } from './repository';
import { eventBus } from '../../infrastructure/eventBus';
import { EventName, OrderCreatedPayload, OrderCompletedPayload, PaymentCompletedPayload } from '../../shared/events';

export const getTables = async () => {
  return await getAllTables();
};

export const initTableSubscribers = () => {
  eventBus.on(EventName.ORDER_CREATED, async (payload: OrderCreatedPayload) => {
    try {
      await updateTableStatusByNumber(payload.tableId, 'occupied');
    } catch (err) {
      console.error(err);
    }
  });

  eventBus.on(EventName.ORDER_COMPLETED, async (payload: OrderCompletedPayload) => {
    try {
      const tableId = await getTableNumberByOrderId(payload.orderId);
      if (tableId) {
        await updateTableStatusByNumber(tableId, 'food_ready');
      }
    } catch (err) {
      console.error(err);
    }
  });

  eventBus.on(EventName.PAYMENT_COMPLETED, async (payload: PaymentCompletedPayload) => {
    try {
      await updateTableStatusByNumber(payload.tableId, 'available');
    } catch (err) {
      console.error(err);
    }
  });
};
