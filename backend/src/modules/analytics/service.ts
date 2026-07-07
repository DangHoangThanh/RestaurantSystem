import bcrypt from 'bcryptjs';
import { getRevenueByDate, insertRevenue, getAllUsers, createUser } from './repository';
import { eventBus } from '../../infrastructure/eventBus';
import { EventName, PaymentCompletedPayload } from '../../shared/events';

export const fetchRevenue = async (date: string) => {
  const total = await getRevenueByDate(date);
  return { date, total: parseInt(total as string, 10) || 0 };
};

export const fetchUsers = async () => {
  return await getAllUsers();
};

export const addUser = async (username: string, passwordPlain: string, role: string) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(passwordPlain, salt);
  return await createUser(username, passwordHash, role);
};

export const initAnalyticsSubscribers = () => {
  eventBus.on(EventName.PAYMENT_COMPLETED, async (payload: PaymentCompletedPayload) => {
    try {
      await insertRevenue(payload.billId, payload.amount);
    } catch (err) {
      console.error('Error recording revenue', err);
    }
  });
};
