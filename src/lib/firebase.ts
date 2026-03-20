import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDemoKeyForPVZSimulator00000000000',
  authDomain: 'pvzsimulator-default-rtdb.firebaseapp.com',
  databaseURL: 'https://pvzsimulator-default-rtdb.firebaseio.com/',
  projectId: 'pvzsimulator',
  storageBucket: 'pvzsimulator.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:pvzsimulator',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export default app;
