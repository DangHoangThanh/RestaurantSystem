import { Router } from 'express';
import { getAllInventory, setInventory } from './service';
import { authorizeRole } from '../../infrastructure/auth';

const router = Router();

router.get('/', authorizeRole(['manager', 'admin']), async (req, res) => {
  try {
    const inventory = await getAllInventory();
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:name', authorizeRole(['manager', 'admin']), async (req, res) => {
  try {
    const { name } = req.params;
    const { quantity } = req.body;
    
    if (typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Quantity must be a number' });
    }
    
    const updated = await setInventory(name as string, quantity);
    if (!updated) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
