import billingRoutes from './routes';
import { initBillingSubscribers } from './service';

export const initBillingModule = () => {
  initBillingSubscribers();
};

export { billingRoutes };
