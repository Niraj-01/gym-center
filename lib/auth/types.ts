/**
 * Auth Provider Types - Firebase-agnostic interface
 * Can be implemented by Firebase, Supabase, or any auth provider
 */

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthProvider {
  // Auth state
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
  
  // Auth methods
  signInWithGoogle(): Promise<User>;
  signOut(): Promise<void>;
  
  // Admin check (will query Firestore or other source)
  isAdminEmail(email: string): Promise<boolean>;
}
