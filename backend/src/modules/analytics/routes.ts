import { Router } from 'express';
import { fetchRevenue, fetchUsers, addUser } from './service';
import { authorizeRole } from '../../infrastructure/auth';

const router = Router();

router.get('/revenue', authorizeRole(['manager', 'admin']), async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date query parameter is required (YYYY-MM-DD)' });
    }
    const data = await fetchRevenue(date);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', authorizeRole(['admin']), async (req, res) => {
  try {
    const users = await fetchUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/users', authorizeRole(['admin']), async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }
    const newUser = await addUser(username, password, role);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Server error or duplicate user' });
  }
});

export default router;
