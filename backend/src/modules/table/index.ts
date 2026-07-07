import tableRoutes from './routes';
import { initTableSubscribers } from './service';

export const initTableModule = () => {
  initTableSubscribers();
};

export { tableRoutes };
