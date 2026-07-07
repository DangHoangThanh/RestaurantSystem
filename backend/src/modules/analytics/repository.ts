import { query } from '../../infrastructure/db';

export const getRevenueByDate = async (date: string) => {
  const result = await query(`
    SELECT SUM(amount) as total 
    FROM revenues 
    WHERE date = $1
  `, [date]);
  return result.rows[0].total || 0;
};

export const insertRevenue = async (billId: string, amount: number) => {
  const result = await query(`
    INSERT INTO revenues (bill_id, amount, date)
    VALUES ($1, $2, CURRENT_DATE)
    RETURNING *
  `, [billId, amount]);
  return result.rows[0];
};

export const getAllUsers = async () => {
  const result = await query('SELECT id, username, role, created_at FROM users');
  return result.rows;
};

export const createUser = async (username: string, passwordHash: string, role: string) => {
  const result = await query(`
    INSERT INTO users (username, password, role)
    VALUES ($1, $2, $3)
    RETURNING id, username, role, created_at
  `, [username, passwordHash, role]);
  return result.rows[0];
};
