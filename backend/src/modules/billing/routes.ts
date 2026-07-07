import { Router } from 'express';
import { fetchPendingBill, payBill } from './service';
import { authorizeRole } from '../../infrastructure/auth';

const router = Router();

router.get('/:tableId', authorizeRole(['cashier', 'manager', 'admin']), async (req, res) => {
  try {
    const { tableId } = req.params;
    const bill = await fetchPendingBill(tableId as string);
    if (!bill) {
      return res.status(404).json({ error: 'No pending bill found for this table' });
    }
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:billId/pay', authorizeRole(['cashier', 'manager', 'admin']), async (req, res) => {
  try {
    const { billId } = req.params;
    const bill = await payBill(billId as string);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
