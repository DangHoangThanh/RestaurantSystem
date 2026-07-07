import { query } from '../../infrastructure/db';

export const getUserByUsername = async (username: string) => {
  const result = await query(
    'SELECT id, username, password, role FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0];
};
