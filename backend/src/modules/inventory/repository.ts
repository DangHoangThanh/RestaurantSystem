import { query } from '../../infrastructure/db';

export const getInventory = async () => {
  const result = await query('SELECT id, name, quantity, unit, threshold FROM ingredients ORDER BY name');
  return result.rows;
};

export const updateInventoryQuantity = async (name: string, quantity: number) => {
  const result = await query('UPDATE ingredients SET quantity = $1 WHERE name = $2 RETURNING *', [quantity, name]);
  return result.rows[0];
};

export const getIngredientsForCombo = async (comboId: string, quantityMultiplier: number) => {
  const result = await query(`
    SELECT i.name, i.quantity as "currentQuantity", i.threshold, di.qty_needed * $2 as "deductAmount"
    FROM combo_dishes cd
    JOIN dish_ingredients di ON cd.dish_id = di.dish_id
    JOIN ingredients i ON di.ingredient_name = i.name
    WHERE cd.combo_id = $1
  `, [comboId, quantityMultiplier]);
  return result.rows;
};

export const deductIngredient = async (name: string, deductAmount: number) => {
  const result = await query(`
    UPDATE ingredients 
    SET quantity = GREATEST(quantity - $2, 0) 
    WHERE name = $1 
    RETURNING name, quantity, threshold
  `, [name, deductAmount]);
  return result.rows[0];
};
