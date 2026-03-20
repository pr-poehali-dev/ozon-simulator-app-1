import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  databaseURL: 'https://pvzsimulator-default-rtdb.firebaseio.com/',
  apiKey: 'AIzaSyDemo-placeholder-key',
  authDomain: 'pvzsimulator.firebaseapp.com',
  projectId: 'pvzsimulator',
  storageBucket: 'pvzsimulator.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export default app;
