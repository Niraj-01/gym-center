'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { googleVisionService } from '@/lib/services/googleVisionService';
import {
    dataExtractionService,
    ExtractedMemberData,
} from '@/lib/services/dataExtractionService';
import { getCurrentMonthYear } from '@/lib/utils/ocrUtils';

// Types
export interface OCRScanResult {
    success: boolean;
    data?: ExtractedMemberData;
    metadata?: {
        overallConfidence: number;
        processingTime: string;
        fieldsExtracted: number;
        textLength: number;
        quotaRemaining: number;
    };
    error?: string;
    message?: string;
}

export interface OCRQuotaInfo {
    tier: string;
    used: number;
    limit: number;
    remaining: number;
    resetDate: string;
    percentageUsed: string;
}

/**
 * Get OCR quota for current user
 */
export async function getOCRUsage(userId: string): Promise<OCRQuotaInfo> {
    const supabase = await createClient();
    const monthYear = getCurrentMonthYear();

    // Try to get existing quota
    const { data: quota } = await supabase
        .from('user_ocr_quota')
        .select('*')
        .eq('user_id', userId)
        .eq('month_year', monthYear)
        .single();

    if (quota) {
        return {
            tier: quota.subscription_tier || 'starter',
            used: quota.current_usage || 0,
            limit: quota.monthly_limit || 50,
            remaining: Math.max(0, (quota.monthly_limit || 50) - (quota.current_usage || 0)),
            resetDate: new Date(
                new Date().getFullYear(),
                new Date().getMonth() + 1,
                1
            ).toISOString(),
            percentageUsed: (
                ((quota.current_usage || 0) / (quota.monthly_limit || 50)) *
                100
            ).toFixed(1),
        };
    }

    // Create new quota record if doesn't exist
    const defaultLimit = 50;
    await supabase.from('user_ocr_quota').insert({
        user_id: userId,
        month_year: monthYear,
        subscription_tier: 'starter',
        monthly_limit: defaultLimit,
        current_usage: 0,
    });

    return {
        tier: 'starter',
        used: 0,
        limit: defaultLimit,
        remaining: defaultLimit,
        resetDate: new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            1
        ).toISOString(),
        percentageUsed: '0',
    };
}

/**
 * Check if user has remaining quota
 */
export async function checkQuota(
    userId: string
): Promise<{ allowed: boolean; quota: OCRQuotaInfo }> {
    const quota = await getOCRUsage(userId);
    return {
        allowed: quota.remaining > 0,
        quota,
    };
}

/**
 * Increment user's OCR usage
 */
async function incrementUsage(userId: string): Promise<void> {
    const supabase = await createClient();
    const monthYear = getCurrentMonthYear();

    await supabase
        .from('user_ocr_quota')
        .update({
            current_usage: supabase.rpc('increment_ocr_usage', { p_user_id: userId }),
        })
        .eq('user_id', userId)
        .eq('month_year', monthYear);

    // Alternative: Direct SQL increment
    await supabase.rpc('increment_ocr_usage', { p_user_id: userId });
}

/**
 * Log OCR attempt to database
 */
async function logOCRAttempt(data: {
    userId: string;
    memberId?: number;
    status: 'success' | 'failed' | 'partial';
    confidence?: number;
    processingTime: number;
    fieldsExtracted?: number;
    errorMessage?: string;
    textLength?: number;
    documentType?: string;
}): Promise<void> {
    const supabase = await createClient();

    await supabase.from('ocr_usage_logs').insert({
        user_id: data.userId,
        member_id: data.memberId || null,
        status: data.status,
        confidence_score: data.confidence || null,
        processing_time_ms: data.processingTime,
        fields_extracted: data.fieldsExtracted || 0,
        error_message: data.errorMessage || null,
        raw_text_length: data.textLength || 0,
        document_type: data.documentType || null,
    });
}

/**
 * Process document image and extract member data
 */
export async function scanDocument(
    formData: FormData,
    userId: string
): Promise<OCRScanResult> {
    const startTime = Date.now();

    try {
        // Get file from form data
        const file = formData.get('document') as File | null;

        if (!file) {
            return {
                success: false,
                error: 'NO_FILE',
                message: 'No document image provided',
            };
        }

        // Check quota
        const { allowed, quota } = await checkQuota(userId);

        if (!allowed) {
            return {
                success: false,
                error: 'QUOTA_EXCEEDED',
                message: 'Monthly OCR scan limit reached. Please upgrade your plan.',
            };
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        // Perform OCR
        const ocrResult = await googleVisionService.detectText(imageBuffer);

        if (!ocrResult.success) {
            await logOCRAttempt({
                userId,
                status: 'failed',
                processingTime: Date.now() - startTime,
                errorMessage: ocrResult.error,
            });

            return {
                success: false,
                error: ocrResult.error,
                message: ocrResult.message || 'Failed to process document',
            };
        }

        // Extract structured data
        const extractedData = dataExtractionService.extractMemberData(
            ocrResult.fullText || ''
        );
        const overallConfidence = dataExtractionService.calculateOverallConfidence(
            extractedData.confidence
        );

        // Count extracted fields
        const fieldsExtracted = Object.entries(extractedData)
            .filter(([key, value]) => key !== 'confidence' && value !== null)
            .length;

        // Log successful scan
        await logOCRAttempt({
            userId,
            status: fieldsExtracted > 0 ? 'success' : 'partial',
            confidence: overallConfidence,
            processingTime: Date.now() - startTime,
            fieldsExtracted,
            textLength: ocrResult.textLength,
        });

        // Increment usage
        await incrementUsage(userId);

        return {
            success: true,
            data: extractedData,
            metadata: {
                overallConfidence: parseFloat(overallConfidence.toFixed(2)),
                processingTime: `${Date.now() - startTime}ms`,
                fieldsExtracted,
                textLength: ocrResult.textLength || 0,
                quotaRemaining: quota.remaining - 1,
            },
        };
    } catch (error) {
        console.error('[scanDocument] Error:', error);

        await logOCRAttempt({
            userId,
            status: 'failed',
            processingTime: Date.now() - startTime,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });

        return {
            success: false,
            error: 'PROCESSING_ERROR',
            message: 'Failed to process document. Please try again.',
        };
    }
}

/**
 * Save extracted member data to database
 */
export async function saveMemberFromOCR(
    memberData: {
        name: string;
        phone: string;
        email?: string | null;
        dateOfBirth?: string | null;
        gender?: string | null;
        address?: string | null;
        overallConfidence?: number;
        planId: number;
        startDate: string;
        expiryDate: string;
    },
    userId: string
): Promise<{ success: boolean; memberId?: number; error?: string }> {
    try {
        const supabase = await createClient();

        // Validate required fields
        if (!memberData.name || !memberData.phone) {
            return {
                success: false,
                error: 'Name and phone are required fields',
            };
        }

        // Check for duplicate
        const { data: existing } = await supabase
            .from('members')
            .select('id, name')
            .or(`phone.eq.${memberData.phone},email.eq.${memberData.email || ''}`)
            .limit(1)
            .single();

        if (existing) {
            return {
                success: false,
                error: `Member with this phone or email already exists: ${existing.name}`,
            };
        }

        // Get plan details
        const { data: plan } = await supabase
            .from('plans')
            .select('name')
            .eq('id', memberData.planId)
            .single();

        // Insert new member
        const { data: newMember, error } = await supabase
            .from('members')
            .insert({
                name: memberData.name,
                phone: memberData.phone,
                email: memberData.email || null,
                plan_id: memberData.planId,
                plan: plan?.name || 'Unknown',
                start_date: memberData.startDate,
                expiry_date: memberData.expiryDate,
                ocr_scanned: true,
                ocr_confidence_score: memberData.overallConfidence || 0,
                scanned_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (error) {
            console.error('[saveMemberFromOCR] Error:', error);
            return {
                success: false,
                error: error.message,
            };
        }

        revalidatePath('/members');
        revalidatePath('/dashboard');

        return {
            success: true,
            memberId: newMember.id,
        };
    } catch (error) {
        console.error('[saveMemberFromOCR] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save member',
        };
    }
}
