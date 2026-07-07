import { createKitchenTicket, getActiveTickets, updateTicketStatus, getComboNameByOrderId } from './repository';
import { eventBus } from '../../infrastructure/eventBus';
import { EventName, OrderCreatedPayload } from '../../shared/events';

export const fetchActiveTickets = async () => {
  return await getActiveTickets();
};

export const startTicket = async (ticketId: string) => {
  return await updateTicketStatus(ticketId, 'cooking');
};

export const finishTicket = async (ticketId: string) => {
  const updated = await updateTicketStatus(ticketId, 'done');
  if (updated) {
    eventBus.emit(EventName.ORDER_COMPLETED, {
      orderId: updated.orderId
    });
  }
  return updated;
};

export const initKitchenSubscribers = () => {
  eventBus.on(EventName.ORDER_CREATED, async (payload: OrderCreatedPayload) => {
    try {
      const comboName = await getComboNameByOrderId(payload.id);
      await createKitchenTicket(
        payload.id,
        payload.tableId,
        comboName,
        payload.quantity,
        payload.notes || ''
      );
    } catch (err) {
      console.error('Error creating kitchen ticket', err);
    }
  });
};
