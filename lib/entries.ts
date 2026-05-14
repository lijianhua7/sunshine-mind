import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface JournalEntry {
  userId: string;
  content: string;
  mood: string;
  summary: string;
  tags?: string[];
  type: 'questionnaire' | 'diary' | 'chat';
  isNegative?: boolean;
  createdAt: any;
}

export async function saveJournalEntry(entry: Omit<JournalEntry, 'createdAt'>) {
  const path = `users/${entry.userId}/entries`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...entry,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export interface DailySummary {
  userId: string;
  date: string; // YYYY-MM-DD
  moodTags: string[];
  keyEvents: { title: string; description: string }[];
  doctorNote: string;
  createdAt: any;
}

export async function saveDailySummary(summary: Omit<DailySummary, 'createdAt'>) {
  const path = `users/${summary.userId}/summaries`;
  try {
    const docRef = await addDoc(collection(db, path), {
      ...summary,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getSummaryForDate(userId: string, date: string) {
  const path = `users/${userId}/summaries`;
  try {
    const q = query(
      collection(db, path),
      where('date', '==', date),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as (DailySummary & { id: string });
  } catch (error: any) {
    console.warn('[Firestore] getSummaryForDate failed:', error);
    return null;
  }
}

export async function getEntriesForDateRange(userId: string, startDate: Date, endDate: Date) {
  const path = `users/${userId}/entries`;
  try {
    const q = query(
      collection(db, path),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error: any) {
    console.warn('[Firestore] getEntriesForDateRange failed:', error);
    return [];
  }
}

export async function getUserEntries(userId: string, limitCount = 50) {
  const path = `users/${userId}/entries`;
  try {
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error: any) {
    console.warn('[Firestore] getUserEntries failed:', error);
    return [];
  }
}
