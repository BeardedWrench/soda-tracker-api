"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onSodaEntryCreate = exports.updateUserGoals = exports.getUserGoals = exports.getSodaEntries = exports.createSodaEntry = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// Authentication middleware
const authenticateUser = async (req) => {
    const authHeader = req.headers.authorization;
    if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
        throw new functions.https.HttpsError('unauthenticated', 'No token provided');
    }
    try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken.uid;
    }
    catch (error) {
        throw new functions.https.HttpsError('unauthenticated', 'Invalid token');
    }
};
// Error handler
const handleError = (error) => {
    console.error('Error:', error);
    const errorObj = error;
    return {
        error: {
            code: errorObj.code || 'internal',
            message: errorObj.message || 'An unexpected error occurred'
        }
    };
};
// API Endpoints
exports.createSodaEntry = functions.https.onRequest(async (req, res) => {
    try {
        const userId = await authenticateUser(req);
        const data = req.body;
        const entry = Object.assign(Object.assign({ userId }, data), { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        const docRef = await db.collection('sodaEntries').add(entry);
        const createdEntry = Object.assign({ id: docRef.id }, entry);
        res.json({ data: createdEntry });
    }
    catch (error) {
        res.status(500).json(handleError(error));
    }
});
exports.getSodaEntries = functions.https.onRequest(async (req, res) => {
    try {
        const userId = await authenticateUser(req);
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        if (!startDate || !endDate) {
            throw new functions.https.HttpsError('invalid-argument', 'startDate and endDate are required');
        }
        const querySnapshot = await db
            .collection('sodaEntries')
            .where('userId', '==', userId)
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .orderBy('date', 'asc')
            .get();
        const entries = querySnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({ data: entries });
    }
    catch (error) {
        res.status(500).json(handleError(error));
    }
});
exports.getUserGoals = functions.https.onRequest(async (req, res) => {
    try {
        const userId = await authenticateUser(req);
        const querySnapshot = await db
            .collection('userGoals')
            .where('userId', '==', userId)
            .limit(1)
            .get();
        if (querySnapshot.empty) {
            // Create default goals if none exist
            const defaultGoals = {
                userId,
                dailyLimit: 16,
                weeklyLimit: 64,
                targetReduction: 20,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const docRef = await db.collection('userGoals').add(defaultGoals);
            const goals = Object.assign({ id: docRef.id }, defaultGoals);
            res.json({ data: goals });
        }
        else {
            const doc = querySnapshot.docs[0];
            const goals = Object.assign({ id: doc.id }, doc.data());
            res.json({ data: goals });
        }
    }
    catch (error) {
        res.status(500).json(handleError(error));
    }
});
exports.updateUserGoals = functions.https.onRequest(async (req, res) => {
    try {
        const userId = await authenticateUser(req);
        const data = req.body;
        const querySnapshot = await db
            .collection('userGoals')
            .where('userId', '==', userId)
            .limit(1)
            .get();
        if (querySnapshot.empty) {
            throw new functions.https.HttpsError('not-found', 'User goals not found');
        }
        const doc = querySnapshot.docs[0];
        const updatedGoals = Object.assign(Object.assign({}, data), { updatedAt: new Date().toISOString() });
        await doc.ref.update(updatedGoals);
        const goals = Object.assign(Object.assign({ id: doc.id }, doc.data()), updatedGoals);
        res.json({ data: goals });
    }
    catch (error) {
        res.status(500).json(handleError(error));
    }
});
// Firestore Triggers
exports.onSodaEntryCreate = functions.firestore
    .document('sodaEntries/{entryId}')
    .onCreate(async (snap, context) => {
    // const entry = snap.data() as SodaEntry;
    // You could add additional processing here, such as:
    // - Updating user statistics
    // - Sending notifications
    // - Generating reports
    console.log(`New soda entry created: ${snap.id}`);
});
//# sourceMappingURL=index.js.map