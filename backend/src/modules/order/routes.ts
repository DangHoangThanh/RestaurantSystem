import { Router, Request, Response } from 'express';
import { fetchMenu, setMenuAvailability, placeOrder, fetchTableOrders } from './service';
import { authorizeRole } from '../../infrastructure/auth';

const router = Router();

// Menu Routes
router.get('/menu', async (req: Request, res: Response) => {
  try {
    const menu = await fetchMenu();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/menu/:id/availability', authorizeRole(['admin', 'manager']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      res.status(400).json({ error: 'isAvailable must be a boolean' });
      return;
    }
    const updated = await setMenuAvailability(id, isAvailable);
    if (!updated) {
      res.status(404).json({ error: 'Menu item not found' });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Order Routes
router.post('/orders', authorizeRole(['server', 'manager', 'admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { tableId, comboId, quantity, notes } = req.body;
    if (!tableId || !comboId || !quantity) {
      res.status(400).json({ error: 'tableId, comboId, and quantity are required' });
      return;
    }
    const order = await placeOrder(tableId, comboId, quantity, notes);
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/orders/table/:tableId', authorizeRole(['server', 'cashier', 'manager', 'admin']), async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    const orders = await fetchTableOrders(tableId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
