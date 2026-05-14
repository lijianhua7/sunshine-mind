import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';

export async function testFirebaseConnection() {
  try {
    // Attempt to read a dummy document to verify Firestore is reachable
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log('Firebase connection verified');
  } catch (error) {
    console.warn('Firebase connection check failed. This is common during initial setup or if rules are missing.', error);
  }
}
