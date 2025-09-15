import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { expenseStorage, limitsStorage } from '../utils/storage';
import { calculateCategorySpending, calculateMonthlyTrends, calculateLimitProgress } from '../utils/analytics';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle, Target } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function Dashboard() {
  const { user } = useAuth();

  const expenses = useMemo(() => {
    return user ? expenseStorage.getAll(user.id) : [];
  }, [user]);

  const limits = useMemo(() => {
    return user ? limitsStorage.getAll(user.id) : [];
  }, [user]);

  const categoryData = useMemo(() => calculateCategorySpending(expenses), [expenses]);
  const monthlyTrends = useMemo(() => calculateMonthlyTrends(expenses), [expenses]);
  const limitProgress = useMemo(() => calculateLimitProgress(expenses, limits), [expenses, limits]);

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  });

  const totalThisMonth = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const avgDaily = totalThisMonth / new Date().getDate();

  const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
  const lastMonthStart = startOfMonth(lastMonth);
  const lastMonthEnd = endOfMonth(lastMonth);

  const lastMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= lastMonthStart && expenseDate <= lastMonthEnd;
  });

  const lastMonthTotal = lastMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyChange = lastMonthTotal > 0 ? ((totalThisMonth - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#EC4899', '#14B8A6'];

  const recentExpenses = expenses
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
        </div>
        <div className="mt-4 sm:mt-0 text-sm text-gray-500">
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">This Month</p>
              <p className="text-3xl font-bold">${totalThisMonth.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Daily Average</p>
              <p className="text-3xl font-bold">${avgDaily.toFixed(2)}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Expenses</p>
              <p className="text-3xl font-bold">{expenses.length}</p>
            </div>
            <Target className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className={`bg-gradient-to-br p-6 rounded-xl text-white ${
          monthlyChange >= 0 
            ? 'from-red-500 to-red-600' 
            : 'from-green-500 to-green-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm">Monthly Change</p>
              <p className="text-3xl font-bold">
                {monthlyChange >= 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
              </p>
            </div>
            {monthlyChange >= 0 ? (
              <TrendingUp className="h-8 w-8 text-white text-opacity-80" />
            ) : (
              <TrendingDown className="h-8 w-8 text-white text-opacity-80" />
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Spending */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No expenses to display
            </div>
          )}
        </div>

        {/* Monthly Trends */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
          {monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data to display
            </div>
          )}
        </div>
      </div>

      {/* Spending Limits Progress */}
      {limitProgress.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Spending Limits Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {limitProgress.map((progress) => (
              <div key={progress.category} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{progress.category}</span>
                  {progress.isOverBudget && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>${progress.spent.toFixed(2)} spent</span>
                    <span>${progress.limit.toFixed(2)} limit</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progress.isOverBudget 
                          ? 'bg-red-500' 
                          : progress.percentage > 80 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {progress.isOverBudget 
                    ? `Over budget by $${(progress.spent - progress.limit).toFixed(2)}`
                    : `$${progress.remaining.toFixed(2)} remaining`
                  }
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Expenses */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
        {recentExpenses.length > 0 ? (
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{expense.description}</p>
                  <p className="text-sm text-gray-600">{expense.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${expense.amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{format(new Date(expense.date), 'MMM dd')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No expenses yet. Start by adding your first expense!
          </div>
        )}
      </div>
    </div>
  );
}