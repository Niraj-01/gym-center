/**
 * Gym Configuration
 * Configurable per gym installation (hardcoded for now)
 */

export const GYM_NAME = "GymCentre";
export const PRODUCT_NAME = "GymCentre";

/**
 * Default renewal-reminder message template.
 * Placeholders: {name} {gym} {plan} {expiry} {status}
 * {status} resolves to e.g. "expired on 5 Jan 2025" or "expires in 3 days (5 Jan 2025)".
 * The Renewals page lets the owner edit this; the edited copy is saved locally.
 */
export const DEFAULT_REMINDER_TEMPLATE =
    "Hi {name}, this is a friendly reminder from {gym}. Your {plan} membership {status}. Please renew to keep your access active. Thank you! 💪";
