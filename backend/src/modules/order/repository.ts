import { query } from '../../infrastructure/db';

export const getMenu = async () => {
  const result = await query('SELECT id, name, price, is_available as "isAvailable" FROM menu_items ORDER BY name');
  return result.rows;
};

export const updateMenuAvailability = async (id: string, isAvailable: boolean) => {
  const result = await query(
    'UPDATE menu_items SET is_available = $1 WHERE id = $2 RETURNING *',
    [isAvailable, id]
  );
  return result.rows[0];
};

export const markCombosUnavailableByIngredient = async (ingredientName: string) => {
  const result = await query(`
    UPDATE menu_items
    SET is_available = false
    WHERE id IN (
      SELECT cd.combo_id
      FROM combo_dishes cd
      JOIN dish_ingredients di ON cd.dish_id = di.dish_id
      WHERE di.ingredient_name = $1
    )
    RETURNING id, name
  `, [ingredientName]);
  return result.rows;
};

export const getComboById = async (comboId: string) => {
  const result = await query('SELECT name, price FROM menu_items WHERE id = $1', [comboId]);
  return result.rows[0];
};

export const createOrder = async (tableId: string, comboId: string, comboName: string, quantity: number, notes: string, totalPrice: number) => {
  const result = await query(
    `INSERT INTO orders (table_id, combo_id, combo_name, quantity, notes, total_price, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING id, table_id AS "tableId", combo_id AS "comboId", combo_name AS "comboName", quantity, notes, total_price AS "totalPrice", status, created_at AS "createdAt"`,
    [tableId, comboId, comboName, quantity, notes, totalPrice]
  );
  return result.rows[0];
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  await query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
};

export const getOrdersByTable = async (tableId: string) => {
  const result = await query(
    `SELECT id, table_id AS "tableId", combo_id AS "comboId", combo_name AS "comboName", quantity, notes, total_price AS "totalPrice", status, created_at AS "createdAt" 
     FROM orders 
     WHERE table_id = $1 
     ORDER BY created_at DESC`,
    [tableId]
  );
  return result.rows;
};
