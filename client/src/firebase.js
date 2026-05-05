import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBNqEs4PoopPsuLksQZWX_LPJgK0tKeLqs",
    authDomain: "billing-system-signal.firebaseapp.com",
    projectId: "billing-system-signal",
    storageBucket: "billing-system-signal.firebasestorage.app",
    messagingSenderId: "1033432144966",
    appId: "1:1033432144966:web:5fc77cefc4a04a40d8fe47",
    measurementId: "G-BP7NR1XLYP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const messaging = getMessaging(app);

export const requestForToken = () => {
    return getToken(messaging, { vapidKey: "BLegiKEAhrYYMopFJbES3gsOE91JN4WwbH5kB8S08mTIQUUhnhk84sU0lP0IClFHrNEYaEHedUhn_E9vmP_4fIs" })
        .then((currentToken) => {
            if (currentToken) {
                console.log('Current token untuk client: ', currentToken);
                return currentToken;
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        })
        .catch((err) => {
            console.log('An error occurred while retrieving token. ', err);
        });
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log("Payload received: ", payload);
            resolve(payload);
        });
    });

export { messaging };