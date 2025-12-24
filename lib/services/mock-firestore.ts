/**
 * Mock Firestore Service - Members
 * TODO: Replace with real Firestore when Firebase is configured
 */

import { Member, MemberFormData, getMemberStatus } from '@/lib/types/member';
import { Plan, PlanFormData } from '@/lib/types/plan';

// Mock data storage (in-memory)
let mockMembers: Member[] = [
    {
        id: 'member-001',
        name: 'Rajesh Kumar',
        phone: '+919876543210',
        email: 'rajesh@example.com',
        photoUrl: 'https://i.pravatar.cc/150?img=12', // Sample avatar
        joinDate: new Date('2024-06-15'),
        planId: 'plan-001',
        planName: 'Monthly Gym',
        membershipStartDate: new Date('2025-01-01'),
        membershipExpiryDate: new Date('2025-02-01'),
        notes: 'Morning batch preferred',
        isActive: true,
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2025-01-01'),
    },
    {
        id: 'member-002',
        name: 'Priya Sharma',
        phone: '+919876543211',
        email: 'priya@example.com',
        photoUrl: 'https://i.pravatar.cc/150?img=5', // Sample avatar
        joinDate: new Date('2024-08-01'),
        planId: 'plan-002',
        planName: '3-Month Gym',
        membershipStartDate: new Date('2024-12-01'),
        membershipExpiryDate: new Date('2025-03-01'),
        isActive: true,
        createdAt: new Date('2024-08-01'),
        updatedAt: new Date('2024-12-01'),
    },
    {
        id: 'member-003',
        name: 'Amit Patel',
        phone: '+919876543212',
        // No photoUrl - will show placeholder
        joinDate: new Date('2024-09-10'),
        planId: 'plan-001',
        planName: 'Monthly Gym',
        membershipStartDate: new Date('2024-12-10'),
        membershipExpiryDate: new Date('2024-12-31'),
        notes: 'Renewal due',
        isActive: false,
        createdAt: new Date('2024-09-10'),
        updatedAt: new Date('2024-12-10'),
    },
    {
        id: 'member-004',
        name: 'Sneha Reddy',
        phone: '+919876543213',
        email: 'sneha@example.com',
        photoUrl: 'https://i.pravatar.cc/150?img=9', // Sample avatar
        joinDate: new Date('2024-10-05'),
        planId: 'plan-001',
        planName: 'Monthly Gym',
        membershipStartDate: new Date('2024-12-20'),
        membershipExpiryDate: new Date('2025-01-20'),
        isActive: true,
        createdAt: new Date('2024-10-05'),
        updatedAt: new Date('2024-12-20'),
    },
];

let mockPlans: Plan[] = [
    {
        id: 'plan-001',
        name: 'Monthly Gym',
        duration: 30,
        price: 1500,
        description: 'Full gym access for 30 days',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 'plan-002',
        name: '3-Month Gym',
        duration: 90,
        price: 4000,
        description: 'Quarterly plan with discount',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 'plan-003',
        name: '6-Month Gym',
        duration: 180,
        price: 7500,
        description: 'Half-yearly plan with 15% discount',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
];

// Auto-increment ID counter
let memberIdCounter = 5;

/**
 * Get all members
 */
export async function getAllMembers(): Promise<Member[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockMembers];
}

/**
 * Get member by ID
 */
export async function getMemberById(id: string): Promise<Member | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockMembers.find(m => m.id === id) || null;
}

/**
 * Create new member
 */
export async function createMember(data: MemberFormData): Promise<Member> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const plan = mockPlans.find(p => p.id === data.planId);
    if (!plan) throw new Error('Plan not found');

    // Calculate expiry date
    const expiryDate = new Date(data.membershipStartDate);
    expiryDate.setDate(expiryDate.getDate() + plan.duration);

    const newMember: Member = {
        id: `member-${String(memberIdCounter++).padStart(3, '0')}`,
        name: data.name,
        phone: data.phone,
        email: data.email,
        joinDate: data.joinDate,
        planId: data.planId,
        planName: plan.name,
        membershipStartDate: data.membershipStartDate,
        membershipExpiryDate: expiryDate,
        notes: data.notes,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    mockMembers.push(newMember);
    return newMember;
}

/**
 * Update member
 */
export async function updateMember(id: string, data: Partial<MemberFormData>): Promise<Member> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const index = mockMembers.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Member not found');

    const member = mockMembers[index];

    // If plan changed, recalculate expiry
    let expiryDate = member.membershipExpiryDate;
    let planName = member.planName;

    if (data.planId && data.planId !== member.planId) {
        const plan = mockPlans.find(p => p.id === data.planId);
        if (!plan) throw new Error('Plan not found');

        planName = plan.name;
        const startDate = data.membershipStartDate || member.membershipStartDate;
        expiryDate = new Date(startDate);
        expiryDate.setDate(expiryDate.getDate() + plan.duration);
    } else if (data.membershipStartDate) {
        // Start date changed, recalculate expiry with current plan
        const plan = mockPlans.find(p => p.id === member.planId);
        if (plan) {
            expiryDate = new Date(data.membershipStartDate);
            expiryDate.setDate(expiryDate.getDate() + plan.duration);
        }
    }

    const updatedMember: Member = {
        ...member,
        ...data,
        planName,
        membershipExpiryDate: expiryDate,
        updatedAt: new Date(),
    };

    mockMembers[index] = updatedMember;
    return updatedMember;
}

/**
 * Delete member
 */
export async function deleteMember(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    mockMembers = mockMembers.filter(m => m.id !== id);
}

/**
 * Get all active plans
 */
export async function getActivePlans(): Promise<Plan[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPlans.filter(p => p.isActive);
}

/**
 * Get plan by ID
 */
export async function getPlanById(id: string): Promise<Plan | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockPlans.find(p => p.id === id) || null;
}

/**
 * Get all plans (including inactive)
 */
export async function getAllPlans(): Promise<Plan[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [...mockPlans];
}

/**
 * Create new plan
 */
export async function createPlan(data: PlanFormData): Promise<Plan> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const newPlan: Plan = {
        id: `plan-${String(mockPlans.length + 1).padStart(3, '0')}`,
        name: data.name,
        duration: data.duration,
        price: data.price,
        description: data.description,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    mockPlans.push(newPlan);
    return newPlan;
}

/**
 * Update plan
 */
export async function updatePlan(id: string, data: Partial<PlanFormData>): Promise<Plan> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const index = mockPlans.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Plan not found');

    const plan = mockPlans[index];
    const updatedPlan: Plan = {
        ...plan,
        ...data,
        updatedAt: new Date(),
    };

    mockPlans[index] = updatedPlan;
    return updatedPlan;
}

/**
 * Toggle plan active status (soft delete/enable)
 */
export async function togglePlanStatus(id: string): Promise<Plan> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const index = mockPlans.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Plan not found');

    const plan = mockPlans[index];
    const updatedPlan: Plan = {
        ...plan,
        isActive: !plan.isActive,
        updatedAt: new Date(),
    };

    mockPlans[index] = updatedPlan;
    return updatedPlan;
}

/**
 * Count members using a specific plan
 */
export async function getMemberCountByPlan(planId: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockMembers.filter(m => m.planId === planId).length;
}

// ============ PAYMENTS ============

import { Payment, PaymentFormData } from '@/lib/types/payment';

// Mock payments storage
let mockPayments: Payment[] = [];

/**
 * Create payment and extend membership
 * This is the core payment + extension logic
 */
export async function createPayment(
    data: PaymentFormData,
    createdBy: string
): Promise<Payment> {
    await new Promise(resolve => setTimeout(resolve, 400));

    // Get member and plan
    const member = await getMemberById(data.memberId);
    if (!member) throw new Error('Member not found');

    const plan = await getPlanById(data.planId);
    if (!plan) throw new Error('Plan not found');

    // Calculate new expiry
    const today = new Date();
    const currentExpiry = member.membershipExpiryDate;

    // If expired, start from today; if active, extend from current expiry
    const startDate = currentExpiry < today ? today : currentExpiry;

    const newExpiry = new Date(startDate);
    newExpiry.setDate(newExpiry.getDate() + plan.duration);

    // Create payment record
    const payment: Payment = {
        id: `payment-${String(mockPayments.length + 1).padStart(3, '0')}`,
        memberId: member.id,
        memberName: member.name,
        memberPhone: member.phone,
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMode: data.paymentMode,
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.duration,
        previousExpiryDate: currentExpiry,
        newExpiryDate: newExpiry,
        notes: data.notes,
        receiptNumber: data.receiptNumber,
        createdAt: new Date(),
        createdBy,
    };

    mockPayments.push(payment);

    // Update member's membership
    await updateMember(member.id, {
        planId: plan.id,
        membershipStartDate: startDate,
        // membershipExpiryDate will be calculated by updateMember
    });

    // Manually set the expiry (updateMember recalculates, so we override)
    const memberIndex = mockMembers.findIndex(m => m.id === member.id);
    if (memberIndex !== -1) {
        mockMembers[memberIndex].membershipExpiryDate = newExpiry;
        mockMembers[memberIndex].planName = plan.name;
        mockMembers[memberIndex].isActive = true;
    }

    return payment;
}

/**
 * Get all payments for a member
 */
export async function getPaymentsByMember(memberId: string): Promise<Payment[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPayments
        .filter(p => p.memberId === memberId)
        .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
}

/**
 * Get all payments (for revenue tracking)
 */
export async function getAllPayments(): Promise<Payment[]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockPayments.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
}

/**
 * Calculate new expiry date (helper for preview)
 */
export function calculateNewExpiry(
    currentExpiryDate: Date,
    planDuration: number
): { startDate: Date; expiryDate: Date } {
    const today = new Date();

    const startDate = currentExpiryDate < today
        ? today
        : currentExpiryDate;

    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + planDuration);

    return { startDate, expiryDate };
}

// ============ DASHBOARD STATS ============

export interface DashboardStats {
    totalMembers: number;
    activeMembers: number;
    dueSoonMembers: number;
    expiredMembers: number;
    thisMonthRevenue: number;
    totalRevenue: number;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const members = await getAllMembers();
    const payments = await getAllPayments();

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Count members by status
    const memberStats = members.reduce(
        (acc, member) => {
            const status = getMemberStatus(member.membershipExpiryDate);
            if (status === 'active') acc.active++;
            else if (status === 'due-soon') acc.dueSoon++;
            else acc.expired++;
            return acc;
        },
        { active: 0, dueSoon: 0, expired: 0 }
    );

    // Calculate revenue
    const thisMonthRevenue = payments
        .filter(p => {
            const date = new Date(p.paymentDate);
            return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
        })
        .reduce((sum, p) => sum + p.amount, 0);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
        totalMembers: members.length,
        activeMembers: memberStats.active,
        dueSoonMembers: memberStats.dueSoon,
        expiredMembers: memberStats.expired,
        thisMonthRevenue,
        totalRevenue,
    };
}

/**
 * Get recent payments for dashboard
 */
export async function getRecentPayments(limit: number = 10): Promise<Payment[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const payments = await getAllPayments();
    return payments.slice(0, limit); // Already sorted by date desc
}
