import { Router } from 'express';
import { getTables } from './service';
import { authorizeRole } from '../../infrastructure/auth';

const router = Router();

router.get('/', authorizeRole(['server', 'manager', 'admin', 'cashier']), async (req, res) => {
  try {
    const tables = await getTables();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
