import { query } from '../../infrastructure/db';

export const getAllTables = async () => {
  const result = await query('SELECT id, table_number as "tableNumber", status FROM tables ORDER BY table_number');
  return result.rows;
};

export const updateTableStatusByNumber = async (tableNumber: string, status: string) => {
  await query('UPDATE tables SET status = $1 WHERE table_number = $2', [status, tableNumber]);
};

export const getTableNumberByOrderId = async (orderId: string): Promise<string | null> => {
  const result = await query('SELECT table_id FROM orders WHERE id = $1', [orderId]);
  return result.rows[0]?.table_id || null;
};
