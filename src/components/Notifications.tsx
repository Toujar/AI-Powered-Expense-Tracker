import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationsStorage } from '../utils/storage';
import { Notification } from '../types';
import { Bell, CheckCircle, AlertTriangle, Info, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function NotificationsPage() {
  const { user } = useAuth();

  const notifications = useMemo(() => {
    return user ? notificationsStorage.getAll(user.id) : [];
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = (type: Notification['type'], read: boolean) => {
    const opacity = read ? 'bg-opacity-30' : 'bg-opacity-60';
    switch (type) {
      case 'success':
        return `bg-green-50 ${opacity}`;
      case 'warning':
        return `bg-yellow-50 ${opacity}`;
      case 'error':
        return `bg-red-50 ${opacity}`;
      default:
        return `bg-blue-50 ${opacity}`;
    }
  };

  const markAsRead = (notificationId: string) => {
    notificationsStorage.markAsRead(notificationId);
    toast.success('Notification marked as read');
    window.location.reload();
  };

  const markAllAsRead = () => {
    if (!user) return;
    notificationsStorage.markAllAsRead(user.id);
    toast.success('All notifications marked as read');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bell className="h-8 w-8 mr-3" />
            Notifications
          </h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You\'re all caught up!'
            }
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center"
          >
            <Check className="h-5 w-5 mr-2" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 rounded-xl border transition-all duration-200 ${
                notification.read 
                  ? 'bg-white border-gray-200' 
                  : `${getBackgroundColor(notification.type, notification.read)} border-gray-300 shadow-sm`
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className={`${notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                    {notification.message}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(notification.createdAt), 'MMM dd, yyyy • h:mm a')}
                  </p>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
            <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-500">You'll receive notifications about spending limits, new expenses, and helpful tips</p>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Info className="h-5 w-5 mr-2 text-blue-600" />
          Notification Types
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-gray-700">Success notifications for completed actions</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-gray-700">Warnings when approaching spending limits</span>
          </div>
          <div className="flex items-center space-x-2">
            <X className="h-4 w-4 text-red-500" />
            <span className="text-gray-700">Alerts when limits are exceeded</span>
          </div>
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-gray-700">General information and tips</span>
          </div>
        </div>
      </div>
    </div>
  );
}