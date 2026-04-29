import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const newProfile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || 'Reader',
            photoURL: u.photoURL || '',
            readingGoal: 12,
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile as any);
        } else {
          setProfile(userSnap.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updateGoal = async (newGoal: number) => {
    if (!user || !profile) return;
    await updateDoc(doc(db, 'users', user.uid), {
      readingGoal: newGoal,
    });
    setProfile({ ...profile, readingGoal: newGoal });
  };

  return { user, profile, loading, updateGoal };
}
