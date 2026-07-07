import bcrypt from 'bcryptjs';
import { getUserByUsername } from './repository';
import { generateToken } from '../../infrastructure/auth';

export const login = async (username: string, password: string) => {
  const user = await getUserByUsername(username);

  if (!user) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return null;
  }

  return generateToken({
    id: user.id,
    username: user.username,
    role: user.role,
  });
};
