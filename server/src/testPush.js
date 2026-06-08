import { Expo } from 'expo-server-sdk';

const expo = new Expo();

const testToken = 'ExponentPushToken[OIrHMfF_8Q7UgkADClYD3d]';

async function send() {
    try {
        const message = {
            to: testToken,
            sound: 'default',
            title: 'Test push',
            body: 'This is a test notification',
            data: { someData: 'goes here' },
        };
        console.log("Sending...");
        const receipts = await expo.sendPushNotificationsAsync([message]);
        console.log("Receipts:", receipts);
    } catch (e) {
        console.error("Error:", e);
    }
}

send();
