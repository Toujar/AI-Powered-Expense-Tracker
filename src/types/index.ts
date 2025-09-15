export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  monthlyBudget?: number;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  receiptUrl?: string;
}

export interface SpendingLimit {
  id: string;
  userId: string;
  category: string;
  amount: number;
  period: 'weekly' | 'monthly';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export type ExpenseCategory = 
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Entertainment'
  | 'Bills & Utilities'
  | 'Healthcare'
  | 'Travel'
  | 'Education'
  | 'Personal Care'
  | 'Other';