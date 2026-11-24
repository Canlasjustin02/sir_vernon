import React, { useEffect } from 'react';
import { isRunningInExpoGo } from 'expo';
import type * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  updatePushTokenOnServer,
  handleForegroundNotification,
  handleNotificationResponse
} from '../../services/notifications/notificationService';
import { subscribeToNotifications, unsubscribeFromNotifications } from '../../services/socketService';
import { addNotification } from '../../store/slices/customer/notification.slice';
import Toast from 'react-native-toast-message';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

export const NotificationWrapper = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!user) return;

    let active = true;
    let foregroundSubscription: Notifications.Subscription | undefined;
    let responseSubscription: Notifications.Subscription | undefined;

    subscribeToNotifications((notification) => {
      dispatch(addNotification(notification));
      Toast.show({
        type: 'info',
        text1: notification.title,
        text2: notification.message,
        visibilityTime: 4000,
      });
    });

    if (!isRunningInExpoGo()) {
      void (async () => {
        const Notifications = await import('expo-notifications');
        if (!active) return;

        foregroundSubscription = Notifications.addNotificationReceivedListener(handleForegroundNotification);
        responseSubscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

        const token = await registerForPushNotificationsAsync();
        if (token && active) {
          await updatePushTokenOnServer(token);
        }
      })().catch((error) => {
        console.error('Failed to initialize push notifications', error);
      });
    }

    return () => {
      active = false;
      foregroundSubscription?.remove();
      responseSubscription?.remove();
      unsubscribeFromNotifications();
    };
  }, [user, dispatch]);

  return <>{children}</>;
};
