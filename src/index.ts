import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { 
  SodaEntry, 
  UserGoals, 
  CreateEntryBody, 
  UpdateGoalsBody,
  ErrorResponse 
} from './types';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Authentication middleware
const authenticateUser = async (req: functions.https.Request): Promise<string> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'No token provided'
    );
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Invalid token'
    );
  }
};

// Error handler
const handleError = (error: unknown): ErrorResponse => {
  console.error('Error:', error);
  const errorObj = error as { code?: string; message?: string };
  return {
    error: {
      code: errorObj.code || 'internal',
      message: errorObj.message || 'An unexpected error occurred'
    }
  };
};

// API Endpoints
export const createSodaEntry = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  try {
    const userId = await authenticateUser(req);
    const data = req.body as CreateEntryBody;
    
    const entry: Omit<SodaEntry, 'id'> = {
      userId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('sodaEntries').add(entry);
    const createdEntry: SodaEntry = {
      id: docRef.id,
      ...entry
    };

    res.json({ data: createdEntry });
  } catch (error) {
    res.status(500).json(handleError(error));
  }
});

export const getSodaEntries = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  try {
    const userId = await authenticateUser(req);
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'startDate and endDate are required'
      );
    }

    const querySnapshot = await db
      .collection('sodaEntries')
      .where('userId', '==', userId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'asc')
      .get();

    const entries: SodaEntry[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<SodaEntry, 'id'>
    }));

    res.json({ data: entries });
  } catch (error) {
    res.status(500).json(handleError(error));
  }
});

export const getUserGoals = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  try {
    const userId = await authenticateUser(req);

    const querySnapshot = await db
      .collection('userGoals')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      // Create default goals if none exist
      const defaultGoals: Omit<UserGoals, 'id'> = {
        userId,
        dailyLimit: 16,
        weeklyLimit: 64,
        targetReduction: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await db.collection('userGoals').add(defaultGoals);
      const goals: UserGoals = {
        id: docRef.id,
        ...defaultGoals
      };

      res.json({ data: goals });
    } else {
      const doc = querySnapshot.docs[0];
      const goals: UserGoals = {
        id: doc.id,
        ...doc.data() as Omit<UserGoals, 'id'>
      };

      res.json({ data: goals });
    }
  } catch (error) {
    res.status(500).json(handleError(error));
  }
});

export const updateUserGoals = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  try {
    const userId = await authenticateUser(req);
    const data = req.body as UpdateGoalsBody;

    const querySnapshot = await db
      .collection('userGoals')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'User goals not found'
      );
    }

    const doc = querySnapshot.docs[0];
    const updatedGoals: Partial<UserGoals> = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    await doc.ref.update(updatedGoals);

    const goals: UserGoals = {
      id: doc.id,
      ...doc.data() as Omit<UserGoals, 'id'>,
      ...updatedGoals
    };

    res.json({ data: goals });
  } catch (error) {
    res.status(500).json(handleError(error));
  }
});

// Firestore Triggers
export const onSodaEntryCreate = functions.firestore
  .document('sodaEntries/{entryId}')
  .onCreate(async (snap: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext) => {
    // const entry = snap.data() as SodaEntry;
    
    // You could add additional processing here, such as:
    // - Updating user statistics
    // - Sending notifications
    // - Generating reports
    
    console.log(`New soda entry created: ${snap.id}`);
  });