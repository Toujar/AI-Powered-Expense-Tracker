import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { expenseStorage, notificationsStorage } from '../utils/storage';
import { simulateOCR } from '../utils/mockOCR';
import { ExpenseCategory } from '../types';
import { Upload, Camera, Loader2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

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

export function UploadExpense() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food & Dining' as ExpenseCategory,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.amount || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const expense = {
      id: uuidv4(),
      userId: user.id,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: formData.date,
      createdAt: new Date().toISOString(),
    };

    expenseStorage.add(expense);
    
    // Add notification
    const notification = {
      id: uuidv4(),
      userId: user.id,
      message: `New expense added: $${expense.amount.toFixed(2)} for ${expense.description}`,
      type: 'success' as const,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notificationsStorage.add(notification);

    toast.success('Expense added successfully!');
    
    // Reset form
    setFormData({
      amount: '',
      category: 'Food & Dining',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsOCRProcessing(true);
    toast.loading('Processing receipt...', { id: 'ocr-processing' });

    try {
      const ocrResult = await simulateOCR(file);
      
      setFormData(prev => ({
        ...prev,
        amount: ocrResult.amount.toString(),
        description: ocrResult.vendor,
        date: ocrResult.date,
        category: ocrResult.category as ExpenseCategory,
      }));

      toast.success(
        `Receipt processed! Confidence: ${(ocrResult.confidence * 100).toFixed(0)}%`,
        { id: 'ocr-processing' }
      );
    } catch (error) {
      toast.error('Failed to process receipt', { id: 'ocr-processing' });
    } finally {
      setIsOCRProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Expense</h1>
        <p className="text-gray-600 mt-1">Manually enter or upload a receipt to add an expense</p>
      </div>

      {/* OCR Upload Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Camera className="h-5 w-5 mr-2" />
          Upload Receipt (OCR)
        </h3>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isOCRProcessing ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600">Processing receipt...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop a receipt image here, or{' '}
                <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                  browse files
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                </label>
              </p>
              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Entry Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Manual Entry</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
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
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
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
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What did you spend money on?"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
          >
            <Check className="h-5 w-5 mr-2" />
            Add Expense
          </button>
        </form>
      </div>
    </div>
  );
}