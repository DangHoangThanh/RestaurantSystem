import { query } from '../../infrastructure/db';

export const createKitchenTicket = async (
  orderId: string,
  tableId: string,
  comboName: string,
  quantity: number,
  notes: string
) => {
  const result = await query(
    `INSERT INTO kitchen_tickets (order_id, table_id, combo_name, quantity, notes, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [orderId, tableId, comboName, quantity, notes || '']
  );
  return result.rows[0];
};

export const getActiveTickets = async () => {
  const result = await query(
    `SELECT 
       id, 
       order_id AS "orderId", 
       table_id AS "tableId", 
       combo_name AS "comboName", 
       quantity, 
       notes, 
       status, 
       created_at AS "createdAt"
     FROM kitchen_tickets 
     WHERE status IN ('pending', 'cooking') 
     ORDER BY created_at ASC`
  );
  return result.rows;
};

export const updateTicketStatus = async (ticketId: string, status: string) => {
  const result = await query(
    `UPDATE kitchen_tickets 
     SET status = $1 
     WHERE id = $2 
     RETURNING id, order_id AS "orderId", table_id AS "tableId", combo_name AS "comboName", quantity, notes, status, created_at AS "createdAt"`,
    [status, ticketId]
  );
  return result.rows[0];
};

export const getComboNameByOrderId = async (orderId: string): Promise<string> => {
  const result = await query('SELECT combo_name FROM orders WHERE id = $1', [orderId]);
  return result.rows[0]?.combo_name || 'Unknown Combo';
};
