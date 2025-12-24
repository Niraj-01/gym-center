/**
 * Home Page - Redirects to dashboard or login
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard (AuthGuard will handle auth check)
  redirect('/dashboard');
}
