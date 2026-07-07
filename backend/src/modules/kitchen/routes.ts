import { Router } from 'express';
import { fetchActiveTickets, startTicket, finishTicket } from './service';
import { authorizeRole } from '../../infrastructure/auth';

const router = Router();

router.get('/tickets', authorizeRole(['chef', 'manager', 'admin']), async (req, res) => {
  try {
    const tickets = await fetchActiveTickets();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/start', authorizeRole(['chef', 'manager', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await startTicket(id as string);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/done', authorizeRole(['chef', 'manager', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await finishTicket(id as string);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
