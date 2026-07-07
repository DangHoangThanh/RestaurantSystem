import { query } from '../../infrastructure/db';

export const getOrderDetails = async (orderId: string) => {
  const result = await query('SELECT table_id AS "tableId", total_price AS "totalPrice" FROM orders WHERE id = $1', [orderId]);
  return result.rows[0];
};

export const createBill = async (orderId: string, tableId: string, totalAmount: number) => {
  const result = await query(
    `INSERT INTO bills (order_id, table_id, total_amount, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING id, order_id AS "orderId", table_id AS "tableId", total_amount AS "totalAmount", status, created_at AS "createdAt"`,
    [orderId, tableId, totalAmount]
  );
  return result.rows[0];
};

export const getPendingBillByTable = async (tableId: string) => {
  const result = await query(
    `SELECT id, order_id AS "orderId", table_id AS "tableId", total_amount AS "totalAmount", status, created_at AS "createdAt" 
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
     RETURNING id, order_id AS "orderId", table_id AS "tableId", total_amount AS "totalAmount", status, created_at AS "createdAt"`,
    [billId]
  );
  return result.rows[0];
};
