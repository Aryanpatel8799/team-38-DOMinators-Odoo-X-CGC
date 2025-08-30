import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { getRelativeTime } from '../../utils/helpers';
import Button from './Button';
import api from '../../services/api';
import socketService from '../../services/socketService';
import toast from 'react-hot-toast';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    setupRealTimeNotifications();
    
    return () => {
      socketService.off('new_notification');
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.data.notifications || []);
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeNotifications = () => {
    socketService.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      showToastNotification(notification);
    });
  };

  const showToastNotification = (notification) => {
    const options = {
      duration: 5000,
      position: 'top-right'
    };

    switch (notification.type) {
      case 'request_assigned':
        toast.success(notification.message, { ...options, icon: '🔧' });
        break;
      case 'payment_received':
        toast.success(notification.message, { ...options, icon: '💰' });
        break;
      case 'emergency_alert':
        toast.error(notification.message, { ...options, icon: '🚨' });
        break;
      case 'service_completed':
        toast.success(notification.message, { ...options, icon: '✅' });
        break;
      default:
        toast(notification.message, options);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
      // Update unread count if the deleted notification was unread
      const notification = notifications.find(n => n._id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'request_assigned':
      case 'service_started':
      case 'service_completed':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-primary-600" />;
      case 'payment_received':
      case 'payment_due':
        return <InformationCircleIcon className="h-5 w-5 text-success-600" />;
      case 'emergency_alert':
        return <ExclamationTriangleIcon className="h-5 w-5 text-danger-600" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-secondary-600" />;
    }
  };

  const getNotificationColor = (type, isRead) => {
    if (isRead) return 'bg-secondary-50 border-secondary-200';
    
    switch (type) {
      case 'emergency_alert':
        return 'bg-danger-50 border-danger-200';
      case 'payment_received':
        return 'bg-success-50 border-success-200';
      case 'request_assigned':
        return 'bg-primary-50 border-primary-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-secondary-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-secondary-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-secondary-900">
                  Notifications
                </h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                    >
                      Mark all read
                    </Button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-secondary-400 hover:text-secondary-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-secondary-600 mt-2">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <BellIcon className="h-12 w-12 text-secondary-300 mx-auto mb-2" />
                  <p className="text-secondary-600">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-secondary-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-secondary-50 transition-colors border-l-4 ${getNotificationColor(notification.type, notification.isRead)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${notification.isRead ? 'text-secondary-600' : 'text-secondary-900 font-medium'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-secondary-500 mt-1">
                              {getRelativeTime(notification.createdAt)}
                            </p>
                            {notification.actionUrl && (
                              <button
                                onClick={() => {
                                  window.location.href = notification.actionUrl;
                                  markAsRead(notification._id);
                                }}
                                className="text-xs text-primary-600 hover:text-primary-800 mt-1"
                              >
                                View Details →
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="text-secondary-400 hover:text-success-600"
                              title="Mark as read"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="text-secondary-400 hover:text-danger-600"
                            title="Delete"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-secondary-200 bg-secondary-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Navigate to notifications page
                    window.location.href = '/notifications';
                  }}
                  className="w-full text-center"
                >
                  View All Notifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
