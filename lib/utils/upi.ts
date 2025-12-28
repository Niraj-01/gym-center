/**
 * UPI Payment Utility
 * Generates UPI deep links for payment processing
 */

export interface UPIParams {
    upiId: string;
    name: string;
    amount: number;
    note: string;
}

/**
 * Generate UPI deep link for payment
 * @param params UPI payment parameters
 * @returns UPI deep link that opens UPI apps (PhonePe, GPay, Paytm, etc.)
 */
export function generateUPILink(params: UPIParams): string {
    const { upiId, name, amount, note } = params;

    // UPI URL format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=CURRENCY&tn=NOTE
    const upiUrl = new URL('upi://pay');
    upiUrl.searchParams.set('pa', upiId); // Payee address (UPI ID)
    upiUrl.searchParams.set('pn', name); // Payee name
    upiUrl.searchParams.set('am', amount.toString()); // Amount
    upiUrl.searchParams.set('cu', 'INR'); // Currency
    upiUrl.searchParams.set('tn', note); // Transaction note

    return upiUrl.toString();
}

/**
 * Get gym UPI details from environment variables
 */
export function getGymUPIDetails(): { upiId: string; name: string } {
    const upiId = process.env.NEXT_PUBLIC_GYM_UPI_ID;
    const name = process.env.NEXT_PUBLIC_GYM_NAME;

    if (!upiId || !name) {
        console.warn('UPI environment variables not configured');
        return {
            upiId: 'gym@paytm', // Fallback
            name: 'Gym Centre'
        };
    }

    return { upiId, name };
}

/**
 * Generate UPI link for membership renewal
 */
export function generateRenewalUPILink(planName: string, amount: number): string {
    const gymDetails = getGymUPIDetails();

    return generateUPILink({
        upiId: gymDetails.upiId,
        name: gymDetails.name,
        amount,
        note: `Membership Renewal - ${planName}`
    });
}
