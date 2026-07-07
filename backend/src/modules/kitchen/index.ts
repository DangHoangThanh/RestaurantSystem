import kitchenRoutes from './routes';
import { initKitchenSubscribers } from './service';

export const initKitchenModule = () => {
  initKitchenSubscribers();
};

export { kitchenRoutes };
