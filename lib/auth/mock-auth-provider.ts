/**
 * Mock Auth Provider - Placeholder until Firebase is configured
 * TODO: Replace with FirebaseAuthProvider when billing is resolved
 */

import { AuthProvider, User } from './types';

// Mock admin whitelist - TODO: Replace with Firestore query
const MOCK_ADMIN_EMAILS = [
    'admin@gymcentre.com',
    'owner@example.com',
    // Add your test email here for development
];

export class MockAuthProvider implements AuthProvider {
    private currentUser: User | null = null;
    private listeners: Array<(user: User | null) => void> = [];

    getCurrentUser(): User | null {
        return this.currentUser;
    }

    onAuthStateChanged(callback: (user: User | null) => void): () => void {
        this.listeners.push(callback);
        // Immediately invoke with current state
        callback(this.currentUser);

        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    async signInWithGoogle(): Promise<User> {
        // Simulate Google sign-in with mock user
        // TODO: Replace with Firebase Google Auth popup

        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock user - change email to test admin/non-admin flows
                const mockUser: User = {
                    uid: 'mock-uid-12345',
                    email: 'admin@gymcentre.com', // Change this to test different scenarios
                    displayName: 'Test Admin User',
                    photoURL: null,
                };

                this.currentUser = mockUser;
                this.notifyListeners(mockUser);
                resolve(mockUser);
            }, 500); // Simulate network delay
        });
    }

    async signOut(): Promise<void> {
        // TODO: Replace with Firebase signOut()
        this.currentUser = null;
        this.notifyListeners(null);
    }

    async isAdminEmail(email: string): Promise<boolean> {
        // TODO: Replace with Firestore query to 'admins' collection
        // Example: const doc = await getDoc(doc(db, 'admins', email));
        // return doc.exists();

        // Mock implementation
        return MOCK_ADMIN_EMAILS.includes(email.toLowerCase());
    }

    private notifyListeners(user: User | null) {
        this.listeners.forEach(listener => listener(user));
    }
}

// Singleton instance
export const mockAuthProvider = new MockAuthProvider();
