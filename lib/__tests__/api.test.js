"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const test = require("firebase-functions-test");
const testEnv = test();
// Initialize admin with a project ID
admin.initializeApp({ projectId: 'demo-test' });
// Import our functions after initializing admin
const { createSodaEntry, getSodaEntries, getUserGoals, updateUserGoals } = require('../index');
describe('API Functions', () => {
    let adminAuth;
    let adminFirestore;
    beforeEach(() => {
        // Mock auth
        adminAuth = jest.spyOn(admin, 'auth').mockReturnValue({
            verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user' }),
        });
        // Mock Firestore
        adminFirestore = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            add: jest.fn(),
            get: jest.fn(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            update: jest.fn(),
        };
        jest.spyOn(admin, 'firestore').mockReturnValue(adminFirestore);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        testEnv.cleanup();
    });
    describe('createSodaEntry', () => {
        it('should create a soda entry for authenticated user', async () => {
            const mockEntry = {
                amount: 12,
                brand: 'Coca-Cola',
                calories: 140,
                sugar: 39,
                carbs: 39,
                caffeine: 34,
                date: new Date().toISOString(),
                userId: 'test-user',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const mockRequest = {
                headers: { authorization: 'Bearer valid-token' },
                body: mockEntry,
            };
            const mockResponse = {
                json: jest.fn(),
            };
            adminFirestore.add.mockResolvedValueOnce({ id: 'test-entry-id' });
            await createSodaEntry(mockRequest, mockResponse);
            expect(adminAuth).toHaveBeenCalled();
            expect(adminFirestore.collection).toHaveBeenCalledWith('sodaEntries');
            expect(adminFirestore.add).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    id: 'test-entry-id',
                    userId: 'test-user',
                }),
            }));
        });
    });
    describe('getSodaEntries', () => {
        it('should return soda entries for authenticated user', async () => {
            const mockEntries = [
                {
                    id: 'entry-1',
                    data: () => ({
                        amount: 12,
                        brand: 'Coca-Cola',
                        date: new Date().toISOString(),
                    }),
                },
            ];
            const mockRequest = {
                headers: { authorization: 'Bearer valid-token' },
                query: {
                    startDate: new Date().toISOString(),
                    endDate: new Date().toISOString(),
                },
            };
            const mockResponse = {
                json: jest.fn(),
            };
            adminFirestore.get.mockResolvedValueOnce({ docs: mockEntries });
            await getSodaEntries(mockRequest, mockResponse);
            expect(adminAuth).toHaveBeenCalled();
            expect(adminFirestore.collection).toHaveBeenCalledWith('sodaEntries');
            expect(adminFirestore.where).toHaveBeenCalledWith('userId', '==', 'test-user');
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'entry-1',
                        amount: 12,
                    }),
                ]),
            }));
        });
    });
    describe('getUserGoals', () => {
        it('should return user goals or create default ones', async () => {
            const mockRequest = {
                headers: { authorization: 'Bearer valid-token' },
            };
            const mockResponse = {
                json: jest.fn(),
            };
            // Mock empty result to test default goals creation
            adminFirestore.get.mockResolvedValueOnce({ empty: true });
            adminFirestore.add.mockResolvedValueOnce({ id: 'new-goals-id' });
            await getUserGoals(mockRequest, mockResponse);
            expect(adminAuth).toHaveBeenCalled();
            expect(adminFirestore.collection).toHaveBeenCalledWith('userGoals');
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    id: 'new-goals-id',
                    dailyLimit: 16,
                    weeklyLimit: 64,
                }),
            }));
        });
    });
    describe('updateUserGoals', () => {
        it('should update user goals', async () => {
            const mockGoals = {
                dailyLimit: 12,
                weeklyLimit: 48,
                targetReduction: 30,
            };
            const mockRequest = {
                headers: { authorization: 'Bearer valid-token' },
                body: mockGoals,
            };
            const mockResponse = {
                json: jest.fn(),
            };
            const mockDoc = {
                id: 'goals-id',
                data: () => ({
                    userId: 'test-user',
                    createdAt: new Date().toISOString(),
                }),
                ref: { update: jest.fn() },
            };
            adminFirestore.get.mockResolvedValueOnce({ empty: false, docs: [mockDoc] });
            await updateUserGoals(mockRequest, mockResponse);
            expect(adminAuth).toHaveBeenCalled();
            expect(adminFirestore.collection).toHaveBeenCalledWith('userGoals');
            expect(mockDoc.ref.update).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    id: 'goals-id',
                    dailyLimit: 12,
                }),
            }));
        });
    });
});
//# sourceMappingURL=api.test.js.map