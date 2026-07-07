import analyticsRoutes from './routes';
import { initAnalyticsSubscribers } from './service';

export const initAnalyticsModule = () => {
  initAnalyticsSubscribers();
};

export { analyticsRoutes };
