import orderRoutes from './routes';
import { initOrderSubscribers } from './service';

export const initOrderModule = () => {
  initOrderSubscribers();
};

export { orderRoutes };
