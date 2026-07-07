import inventoryRoutes from './routes';
import { initInventorySubscribers } from './service';

export const initInventoryModule = () => {
  initInventorySubscribers();
};

export { inventoryRoutes };
