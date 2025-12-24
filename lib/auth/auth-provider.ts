/**
 * Auth Provider Factory
 * Switch between mock and real Firebase provider here
 */

import { AuthProvider } from './types';
import { mockAuthProvider } from './mock-auth-provider';

// TODO: When Firebase is ready, uncomment and import FirebaseAuthProvider
// import { firebaseAuthProvider } from './firebase-auth-provider';

/**
 * Get the active auth provider
 * TODO: Switch to firebaseAuthProvider when ready
 */
export function getAuthProvider(): AuthProvider {
    // For now, always return mock
    // TODO: Return firebaseAuthProvider when Firebase is configured
    return mockAuthProvider;
}

export const authProvider = getAuthProvider();
