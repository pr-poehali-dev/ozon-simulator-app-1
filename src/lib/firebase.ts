import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyANxccq3iXe6tJQLb_HcqyvPxeYrG9o34g',
  authDomain: 'pvzsimulator.firebaseapp.com',
  databaseURL: 'https://pvzsimulator-default-rtdb.firebaseio.com',
  projectId: 'pvzsimulator',
  storageBucket: 'pvzsimulator.firebasestorage.app',
  messagingSenderId: '530722160053',
  appId: '1:530722160053:web:cbc35f0ed56f7351d8adfc',
  measurementId: 'G-NZ8S86BKC9',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export default app;