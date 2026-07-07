import { getMenu, updateMenuAvailability, markCombosUnavailableByIngredient, getComboById, createOrder, updateOrderStatus, getOrdersByTable } from './repository';
import { eventBus } from '../../infrastructure/eventBus';
import { EventName, RawMaterialLowPayload, OrderCompletedPayload } from '../../shared/events';

export const fetchMenu = async () => {
  return await getMenu();
};

export const setMenuAvailability = async (id: string, isAvailable: boolean) => {
  return await updateMenuAvailability(id, isAvailable);
};

export const placeOrder = async (tableId: string, comboId: string, quantity: number, notes: string) => {
  const combo = await getComboById(comboId);
  if (!combo) throw new Error('Combo not found');

  const totalPrice = combo.price * quantity;
  const order = await createOrder(tableId, comboId, combo.name, quantity, notes || '', totalPrice);

  eventBus.emit(EventName.ORDER_CREATED, {
    id: order.id,
    tableId: order.tableId,
    comboId: order.comboId,
    quantity: order.quantity,
    notes: order.notes,
    status: order.status
  });

  return order;
};

export const fetchTableOrders = async (tableId: string) => {
  return await getOrdersByTable(tableId);
};

export const initOrderSubscribers = () => {
  eventBus.on(EventName.RAW_MATERIAL_LOW, async (payload: RawMaterialLowPayload) => {
    try {
      const affected = await markCombosUnavailableByIngredient(payload.ingredientName);
      if (affected.length > 0) {
        console.log(`Set ${affected.length} combos unavailable due to low ${payload.ingredientName}`);
      }
    } catch (err) {
      console.error('Error handling RAW_MATERIAL_LOW in order module', err);
    }
  });

  eventBus.on(EventName.ORDER_COMPLETED, async (payload: OrderCompletedPayload) => {
    try {
      await updateOrderStatus(payload.orderId, 'done');
    } catch (err) {
      console.error('Error handling ORDER_COMPLETED in order module', err);
    }
  });
};
