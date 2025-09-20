import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { expenseStorage } from '../utils/storage';
import { User, Mail, Calendar, DollarSign, Download, Save } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function Profile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    monthlyBudget: user?.monthlyBudget?.toString() || '2000',
  });

  const expenses = user ? expenseStorage.getAll(user.id) : [];
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averagePerExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

  const handleSave = () => {
    if (!user) return;

    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const monthlyBudget = parseFloat(formData.monthlyBudget);
    if (isNaN(monthlyBudget) || monthlyBudget <= 0) {
      toast.error('Please enter a valid monthly budget');
      return;
    }

    updateUser({
      name: formData.name,
      email: formData.email,
      monthlyBudget: monthlyBudget,
    });

    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      monthlyBudget: user?.monthlyBudget?.toString() || '2000',
    });
    setIsEditing(false);
  };

  const exportData = () => {
    if (expenses.length === 0) {
      toast.error('No data to export');
      return;
    }

    const data = {
      user: user,
      expenses: expenses,
      exportDate: new Date().toISOString(),
      summary: {
        totalExpenses: expenses.length,
        totalAmount: totalSpent,
        averagePerExpense: averagePerExpense,
      }
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_data_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and view your spending overview</p>
      </div>

      {/* Profile Information */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Profile Information</h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900 py-2">{user.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-2" />
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900 py-2">{user.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Member Since
            </label>
            <p className="text-gray-900 py-2">{format(new Date(user.createdAt), 'MMMM dd, yyyy')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Monthly Budget Goal
            </label>
            {isEditing ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthlyBudget}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyBudget: e.target.value }))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ) : (
              <p className="text-gray-900 py-2">${user.monthlyBudget?.toFixed(2) || '2000.00'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Spending Overview */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-6">Spending Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Expenses</p>
                <p className="text-2xl font-bold text-blue-900">{expenses.length}</p>
              </div>
              <div className="bg-blue-200 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Spent</p>
                <p className="text-2xl font-bold text-green-900">${totalSpent.toFixed(2)}</p>
              </div>
              <div className="bg-green-200 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Average per Expense</p>
                <p className="text-2xl font-bold text-purple-900">${averagePerExpense.toFixed(2)}</p>
              </div>
              <div className="bg-purple-200 p-3 rounded-full">
                <User className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Data Export</h3>
        <p className="text-gray-600 mb-4">
          Export all your expense data including your profile information and spending history.
        </p>
        <button
          onClick={exportData}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center"
        >
          <Download className="h-5 w-5 mr-2" />
          Export All Data (JSON)
        </button>
      </div>


      {/* App Information */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">About ExpenseTracker</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-2">Features</h4>
            <ul className="space-y-1">
              <li>• Expense tracking with OCR receipt scanning</li>
              <li>• Spending limits and budget management</li>
              <li>• Detailed analytics and insights</li>
              <li>• Advanced search and filtering</li>
              <li>• Real-time notifications</li>
              <li>• AI-powered budgeting assistant</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Security & Privacy</h4>
            <ul className="space-y-1">
              <li>• All data stored locally in your browser</li>
              <li>• No personal information shared</li>
              <li>• Secure authentication system</li>
              <li>• Export your data anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}