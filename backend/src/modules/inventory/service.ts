import { getInventory, updateInventoryQuantity, getIngredientsForCombo, deductIngredient } from './repository';
import { eventBus } from '../../infrastructure/eventBus';
import { EventName, OrderCreatedPayload } from '../../shared/events';

export const getAllInventory = async () => {
  return await getInventory();
};

export const setInventory = async (name: string, quantity: number) => {
  return await updateInventoryQuantity(name, quantity);
};

export const initInventorySubscribers = () => {
  eventBus.on(EventName.ORDER_CREATED, async (payload: OrderCreatedPayload) => {
    try {
      const ingredientsToDeduct = await getIngredientsForCombo(payload.comboId, payload.quantity);
      
      // Combine deductions by ingredient name in case of duplicates (different dishes using the same ingredient)
      const deductionMap: Record<string, { currentQuantity: number, threshold: number, deductAmount: number }> = {};
      
      for (const item of ingredientsToDeduct) {
        if (!deductionMap[item.name]) {
          deductionMap[item.name] = { currentQuantity: parseFloat(item.currentQuantity), threshold: parseFloat(item.threshold), deductAmount: 0 };
        }
        deductionMap[item.name].deductAmount += parseFloat(item.deductAmount);
      }

      for (const name of Object.keys(deductionMap)) {
        const toDeduct = deductionMap[name].deductAmount;
        const updated = await deductIngredient(name, toDeduct);
        if (updated && parseFloat(updated.quantity) <= parseFloat(updated.threshold)) {
          eventBus.emit(EventName.RAW_MATERIAL_LOW, {
            ingredientName: updated.name,
            currentQuantity: parseFloat(updated.quantity),
            threshold: parseFloat(updated.threshold)
          });
        }
      }
    } catch (err) {
      console.error('Error handling inventory deduction', err);
    }
  });
};
