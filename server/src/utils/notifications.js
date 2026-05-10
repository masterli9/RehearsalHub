import { Expo } from 'expo-server-sdk';
import pool from '../db/pool.js';

// Vytvoříme novou instanci Expo klienta
const expo = new Expo();

export const sendPushNotification = async (userId, title, body, data = {}) => {
    try {
        // Zjistíme z databáze, jaký má uživatel token
        const result = await pool.query("SELECT push_token FROM users WHERE user_id = $1", [userId]);
        
        if (result.rows.length === 0 || !result.rows[0].push_token) {
            console.log(`Uživatel ${userId} nemá nastavený push token.`);
            return;
        }

        const pushToken = result.rows[0].push_token;

        // Ověříme, že je token validní (že vypadá jako Expo token)
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Token ${pushToken} není validní Expo push token`);
            return;
        }

        // Sestavíme zprávu
        const message = {
            to: pushToken,
            sound: 'default',
            title: title,
            body: body,
            data: data,
        };

        // Odešleme zprávu přes Expo servery
        const receipts = await expo.sendPushNotificationsAsync([message]);
        console.log("Notifikace odeslána:", receipts);
        
    } catch (error) {
        console.error("Chyba při odesílání notifikace:", error);
    }
};

/**
 * Helper function to send notifications to multiple users at once
 */
export const sendPushNotificationToMultiple = async (userIds, title, body, data = {}) => {
    if (!userIds || userIds.length === 0) return;
    
    try {
        // Můžeme optimalizovat pro odeslání více tokenům najednou
        const result = await pool.query("SELECT user_id, push_token FROM users WHERE user_id = ANY($1)", [userIds]);
        
        const messages = [];
        for (const row of result.rows) {
            if (row.push_token && Expo.isExpoPushToken(row.push_token)) {
                messages.push({
                    to: row.push_token,
                    sound: 'default',
                    title: title,
                    body: body,
                    data: data,
                });
            }
        }

        if (messages.length === 0) return;

        // Expo dokáže poslat více zpráv najednou v dávkách
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                await expo.sendPushNotificationsAsync(chunk);
            } catch (error) {
                console.error("Chyba v odesílání chunku notifikací:", error);
            }
        }
    } catch (error) {
         console.error("Chyba při hromadném odesílání notifikací:", error);
    }
}
