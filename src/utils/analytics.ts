import { Expense, SpendingLimit } from '../types';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

export function calculateCategorySpending(expenses: Expense[]) {
  const categoryTotals: Record<string, number> = {};
  
  expenses.forEach(expense => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
  });
  
  return Object.entries(categoryTotals).map(([category, amount]) => ({
    category,
    amount,
  }));
}

export function calculateMonthlyTrends(expenses: Expense[]) {
  const trends: Record<string, number> = {};
  
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const monthKey = format(date, 'MMM yyyy');
    trends[monthKey] = 0;
  }
  
  expenses.forEach(expense => {
    const expenseDate = new Date(expense.date);
    const monthKey = format(expenseDate, 'MMM yyyy');
    if (trends.hasOwnProperty(monthKey)) {
      trends[monthKey] += expense.amount;
    }
  });
  
  return Object.entries(trends).map(([month, amount]) => ({
    month,
    amount,
  }));
}

export function calculateLimitProgress(expenses: Expense[], limits: SpendingLimit[]) {
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  return limits.map(limit => {
    const categoryExpenses = expenses.filter(expense => 
      expense.category === limit.category &&
      new Date(expense.date) >= monthStart &&
      new Date(expense.date) <= monthEnd
    );
    
    const spent = categoryExpenses.reduce((total, expense) => total + expense.amount, 0);
    const percentage = Math.min((spent / limit.amount) * 100, 100);
    
    return {
      category: limit.category,
      spent,
      limit: limit.amount,
      percentage,
      remaining: Math.max(limit.amount - spent, 0),
      isOverBudget: spent > limit.amount,
    };
  });
}

export function generateSpendingTips(expenses: Expense[]): string[] {
  const tips = [
    "Consider setting a weekly budget for dining out to control food expenses.",
    "Track your subscriptions - they can add up quickly over time.",
    "Use the 24-hour rule before making non-essential purchases.",
    "Look for opportunities to consolidate trips to save on transportation costs.",
    "Review your entertainment spending and consider free alternatives.",
    "Set up automatic transfers to savings to pay yourself first.",
  ];
  
  return tips.slice(0, 3);
}