import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { limitsStorage, expenseStorage, notificationsStorage } from '../utils/storage';
import { SpendingLimit, ExpenseCategory } from '../types';
import { Target, Plus, Trash2, Edit3, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { calculateLimitProgress } from '../utils/analytics';

const CATEGORIES: ExpenseCategory[] = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Other',
];

export function SpendingLimits() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingLimit, setEditingLimit] = useState<SpendingLimit | null>(null);
  const [formData, setFormData] = useState({
    category: 'Food & Dining' as ExpenseCategory,
    amount: '',
    period: 'monthly' as 'weekly' | 'monthly',
  });

  const limits = useMemo(() => {
    return user ? limitsStorage.getAll(user.id) : [];
  }, [user]);

  const expenses = useMemo(() => {
    return user ? expenseStorage.getAll(user.id) : [];
  }, [user]);

  const limitProgress = useMemo(() => {
    return calculateLimitProgress(expenses, limits);
  }, [expenses, limits]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.amount) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    // Check if limit already exists for this category
    const existingLimit = limits.find(limit => 
      limit.category === formData.category && 
      limit.period === formData.period &&
      (!editingLimit || limit.id !== editingLimit.id)
    );

    if (existingLimit) {
      toast.error(`A ${formData.period} limit for ${formData.category} already exists`);
      return;
    }

    if (editingLimit) {
      // Update existing limit
      limitsStorage.update(editingLimit.id, {
        category: formData.category,
        amount: amount,
        period: formData.period,
      });
      toast.success('Spending limit updated!');
    } else {
      // Create new limit
      const newLimit: SpendingLimit = {
        id: uuidv4(),
        userId: user.id,
        category: formData.category,
        amount: amount,
        period: formData.period,
        createdAt: new Date().toISOString(),
      };

      limitsStorage.add(newLimit);
      
      // Add notification
      const notification = {
        id: uuidv4(),
        userId: user.id,
        message: `New ${formData.period} spending limit set for ${formData.category}: $${amount.toFixed(2)}`,
        type: 'info' as const,
        read: false,
        createdAt: new Date().toISOString(),
      };
      notificationsStorage.add(notification);

      toast.success('Spending limit created!');
    }

    // Reset form
    setFormData({
      category: 'Food & Dining',
      amount: '',
      period: 'monthly',
    });
    setShowForm(false);
    setEditingLimit(null);
    window.location.reload(); // Refresh to show updated data
  };

  const handleEdit = (limit: SpendingLimit) => {
    setEditingLimit(limit);
    setFormData({
      category: limit.category,
      amount: limit.amount.toString(),
      period: limit.period,
    });
    setShowForm(true);
  };

  const handleDelete = (limitId: string) => {
    if (window.confirm('Are you sure you want to delete this spending limit?')) {
      limitsStorage.delete(limitId);
      toast.success('Spending limit deleted');
      window.location.reload(); // Refresh to show updated data
    }
  };

  const cancelEdit = () => {
    setEditingLimit(null);
    setFormData({
      category: 'Food & Dining',
      amount: '',
      period: 'monthly',
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Spending Limits</h1>
          <p className="text-gray-600 mt-1">Set and manage your spending limits by category</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Limit
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingLimit ? 'Edit Spending Limit' : 'Add Spending Limit'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as 'weekly' | 'monthly' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                {editingLimit ? 'Update Limit' : 'Create Limit'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Limits Progress */}
      {limitProgress.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {limitProgress.map((progress) => {
            const limit = limits.find(l => l.category === progress.category);
            return (
              <div key={progress.category} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-gray-900">{progress.category}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {progress.isOverBudget && (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    {limit && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(limit)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(limit.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Spent</span>
                    <span className="font-medium">${progress.spent.toFixed(2)}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        progress.isOverBudget 
                          ? 'bg-red-500' 
                          : progress.percentage > 80 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Limit</span>
                    <span className="font-medium">${progress.limit.toFixed(2)}</span>
                  </div>

                  <div className={`text-center p-3 rounded-lg ${
                    progress.isOverBudget 
                      ? 'bg-red-50 text-red-700' 
                      : progress.percentage > 80 
                      ? 'bg-yellow-50 text-yellow-700' 
                      : 'bg-green-50 text-green-700'
                  }`}>
                    {progress.isOverBudget 
                      ? `Over budget by $${(progress.spent - progress.limit).toFixed(2)}`
                      : `$${progress.remaining.toFixed(2)} remaining`
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No spending limits set</h3>
          <p className="text-gray-500 mb-6">Set spending limits to better track and control your expenses</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            Create Your First Limit
          </button>
        </div>
      )}
    </div>
  );
}