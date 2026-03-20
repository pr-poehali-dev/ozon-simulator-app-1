import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db } from './firebase';

export type { User };

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'client' | 'admin';
  createdAt: number;
}

export async function registerUser(email: string, password: string, name: string): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  const profile: UserProfile = {
    uid: cred.user.uid,
    name,
    email,
    role: 'client',
    createdAt: Date.now(),
  };
  await set(ref(db, `users/${cred.user.uid}`), profile);
  return profile;
}

export async function loginUser(email: string, password: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await get(ref(db, `users/${cred.user.uid}`));
  if (snap.exists()) return snap.val() as UserProfile;
  const profile: UserProfile = {
    uid: cred.user.uid,
    name: cred.user.displayName ?? email,
    email,
    role: 'client',
    createdAt: Date.now(),
  };
  await set(ref(db, `users/${cred.user.uid}`), profile);
  return profile;
}

export async function loginAdmin(email: string, password: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await get(ref(db, `users/${cred.user.uid}`));
  const profile = snap.exists() ? (snap.val() as UserProfile) : {
    uid: cred.user.uid,
    name: cred.user.displayName ?? 'Администратор',
    email,
    role: 'admin' as const,
    createdAt: Date.now(),
  };
  if (!snap.exists()) await set(ref(db, `users/${cred.user.uid}`), { ...profile, role: 'admin' });
  return profile;
}

export async function logoutUser() {
  await signOut(auth);
}

export function onAuthChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? (snap.val() as UserProfile) : null;
}
