import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Mandatory connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. You appear offline.");
    }
  }
}
testConnection();

// Google login popup helper
let activeLoginPromise: Promise<any> | null = null;

export async function logInWithGoogle() {
  if (activeLoginPromise) {
    console.log("An authentication login popup is already active. Returning the existing login promise.");
    return activeLoginPromise;
  }

  activeLoginPromise = (async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Auth login failure inside logInWithGoogle:", error);
      throw error;
    } finally {
      activeLoginPromise = null;
    }
  })();

  return activeLoginPromise;
}

// Signout helper
export async function logOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Auth signout failure:", error);
    throw error;
  }
}

// WhatsApp sending interaction logger
export async function logWhatsAppInteraction(userId: string, payload: {
  message: string;
  type: string;
  items?: any[];
  total?: number | string;
}) {
  if (!userId) return;
  try {
    await addDoc(collection(db, 'whatsapp_logs'), {
      userId,
      message: payload.message,
      type: payload.type,
      items: payload.items || [],
      total: payload.total || 0,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.warn("Could not log WhatsApp interaction:", e);
  }
}
