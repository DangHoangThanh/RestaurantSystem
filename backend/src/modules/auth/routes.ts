import { Router, Request, Response } from 'express';
import { login } from './service';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const token = await login(username, password);

    if (!token) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
