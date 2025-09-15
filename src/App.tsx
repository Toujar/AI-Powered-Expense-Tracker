import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { notificationsStorage, limitsStorage, expenseStorage } from './utils/storage';
import { Auth } from './components/Auth';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { UploadExpense } from './components/UploadExpense';
import { SpendingLimits } from './components/SpendingLimits';
import { SearchHistory } from './components/SearchHistory';
import { NotificationsPage } from './components/Notifications';
import { Profile } from './components/Profile';
import { calculateLimitProgress } from './utils/analytics';
import { Toaster } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (user) {
      // Count unread notifications
      const notifications = notificationsStorage.getAll(user.id);
      const unreadCount = notifications.filter(n => !n.read).length;
      setUnreadNotifications(unreadCount);

      // Check spending limits and create notifications if needed
      const expenses = expenseStorage.getAll(user.id);
      const limits = limitsStorage.getAll(user.id);
      const limitProgress = calculateLimitProgress(expenses, limits);

      limitProgress.forEach(progress => {
        if (progress.isOverBudget) {
          // Check if we already have a recent notification for this category
          const recentNotifications = notifications.filter(n => 
            n.message.includes(progress.category) && 
            n.message.includes('over budget') &&
            new Date(n.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          );

          if (recentNotifications.length === 0) {
            const notification = {
              id: uuidv4(),
              userId: user.id,
              message: `⚠️ You're over budget for ${progress.category}! Spent $${progress.spent.toFixed(2)} of $${progress.limit.toFixed(2)} limit.`,
              type: 'warning' as const,
              read: false,
              createdAt: new Date().toISOString(),
            };
            notificationsStorage.add(notification);
          }
        } else if (progress.percentage > 80) {
          // Check if we already have a recent notification for this category
          const recentNotifications = notifications.filter(n => 
            n.message.includes(progress.category) && 
            n.message.includes('approaching') &&
            new Date(n.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          );

          if (recentNotifications.length === 0) {
            const notification = {
              id: uuidv4(),
              userId: user.id,
              message: `📊 You're approaching your ${progress.category} limit. ${progress.percentage.toFixed(0)}% used ($${progress.remaining.toFixed(2)} remaining).`,
              type: 'info' as const,
              read: false,
              createdAt: new Date().toISOString(),
            };
            notificationsStorage.add(notification);
          }
        }
      });
    }
  }, [user, currentPage]);

  if (!isAuthenticated) {
    return <Auth />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return <UploadExpense />;
      case 'limits':
        return <SpendingLimits />;
      case 'search':
        return <SearchHistory />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        unreadNotifications={unreadNotifications}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentPage()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;