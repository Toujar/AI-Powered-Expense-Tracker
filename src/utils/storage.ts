import { Expense, SpendingLimit, Notification } from '../types';

const STORAGE_KEYS = {
  EXPENSES: 'expense_tracker_expenses',
  LIMITS: 'expense_tracker_limits',
  NOTIFICATIONS: 'expense_tracker_notifications',
};

export const expenseStorage = {
  getAll: (userId: string): Expense[] => {
    const expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
    return expenses.filter((expense: Expense) => expense.userId === userId);
  },

  add: (expense: Expense): void => {
    const expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
    expenses.push(expense);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  },

  update: (id: string, updatedExpense: Partial<Expense>): void => {
    const expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
    const index = expenses.findIndex((e: Expense) => e.id === id);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updatedExpense };
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    }
  },

  delete: (id: string): void => {
    const expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
    const filtered = expenses.filter((e: Expense) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
  },
};

export const limitsStorage = {
  getAll: (userId: string): SpendingLimit[] => {
    const limits = JSON.parse(localStorage.getItem(STORAGE_KEYS.LIMITS) || '[]');
    return limits.filter((limit: SpendingLimit) => limit.userId === userId);
  },

  add: (limit: SpendingLimit): void => {
    const limits = JSON.parse(localStorage.getItem(STORAGE_KEYS.LIMITS) || '[]');
    limits.push(limit);
    localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(limits));
  },

  update: (id: string, updatedLimit: Partial<SpendingLimit>): void => {
    const limits = JSON.parse(localStorage.getItem(STORAGE_KEYS.LIMITS) || '[]');
    const index = limits.findIndex((l: SpendingLimit) => l.id === id);
    if (index !== -1) {
      limits[index] = { ...limits[index], ...updatedLimit };
      localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(limits));
    }
  },

  delete: (id: string): void => {
    const limits = JSON.parse(localStorage.getItem(STORAGE_KEYS.LIMITS) || '[]');
    const filtered = limits.filter((l: SpendingLimit) => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(filtered));
  },
};

export const notificationsStorage = {
  getAll: (userId: string): Notification[] => {
    const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    return notifications.filter((notification: Notification) => notification.userId === userId);
  },

  add: (notification: Notification): void => {
    const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    notifications.unshift(notification);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  markAsRead: (id: string): void => {
    const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    const index = notifications.findIndex((n: Notification) => n.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    }
  },

  markAllAsRead: (userId: string): void => {
    const notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    const updated = notifications.map((n: Notification) => 
      n.userId === userId ? { ...n, read: true } : n
    );
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  },
};