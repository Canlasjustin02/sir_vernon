import { Expo } from 'expo-server-sdk';
import logger from '../config/logger.js';
const expo = new Expo();
export const sendPushNotification = async (pushToken, title, body, data) => {
    if (!Expo.isExpoPushToken(pushToken)) {
        logger.error(`Push token ${pushToken} is not a valid Expo push token`);
        return;
    }
    const messages = [{
            to: pushToken,
            sound: 'default',
            title,
            body,
            data,
            priority: 'high',
        }];
    try {
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];
        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }
        logger.debug('Push notification tickets:', tickets);
        return tickets;
    }
    catch (error) {
        logger.error('Error sending push notification:', error);
    }
};
export default expo;
