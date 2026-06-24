/**
 * Landing Page — Public marketing home for GymCentre.
 * Clean, minimal, Apple/Google-inspired. Sections: Hero, Product, About,
 * Pricing (coming soon), Privacy, and a footer with social links.
 * The "Log in" CTA routes to the existing /login admin portal.
 */

import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';
import { PRODUCT_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} — Gym management, beautifully simple`,
  description:
    'GymCentre is the calm, modern way to run your gym — members, payments, plans, and attendance in one clean dashboard.',
};

export default function HomePage() {
  return <LandingPage />;
}
