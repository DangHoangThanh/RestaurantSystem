import { query } from '../../infrastructure/db';

export const getOrderDetails = async (orderId: string) => {
  const result = await query('SELECT table_id, total_price FROM orders WHERE id = $1', [orderId]);
  return result.rows[0];
};

export const createBill = async (orderId: string, tableId: string, totalAmount: number) => {
  const result = await query(
    `INSERT INTO bills (order_id, table_id, total_amount, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [orderId, tableId, totalAmount]
  );
  return result.rows[0];
};

export const getPendingBillByTable = async (tableId: string) => {
  const result = await query(
    `SELECT id, total_amount as "totalAmount", status 
     FROM bills 
     WHERE table_id = $1 AND status = 'pending'
     LIMIT 1`,
    [tableId]
  );
  return result.rows[0];
};

export const markBillAsPaid = async (billId: string) => {
  const result = await query(
    `UPDATE bills 
     SET status = 'paid' 
     WHERE id = $1 
     RETURNING *`,
    [billId]
  );
  return result.rows[0];
};
