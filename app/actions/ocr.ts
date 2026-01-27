'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { googleVisionService } from '@/lib/services/googleVisionService';
import {
    dataExtractionService,
    ExtractedMemberData,
} from '@/lib/services/dataExtractionService';
import { geminiService } from '@/lib/services/geminiService';
import { getCurrentMonthYear } from '@/lib/utils/ocrUtils';
import { logger } from '@/lib/utils/logger';

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
 * Uses Gemini AI for handwriting recognition (primary)
 * Falls back to Google Vision + regex extraction if Gemini unavailable
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

        let extractedData: ExtractedMemberData;
        let overallConfidence: number;
        let textLength = 0;
        let extractionMethod = 'unknown';

        // Try Gemini AI extraction first (better for handwriting)
        if (geminiService.isAvailable()) {
            logger.log('[scanDocument] Using Gemini AI for extraction');
            extractionMethod = 'gemini';

            const geminiResult = await geminiService.extractMemberDetails(imageBuffer, file.type);

            if (geminiResult.success && geminiResult.data) {
                // Map Gemini response to ExtractedMemberData format
                extractedData = {
                    name: geminiResult.data.name,
                    phone: geminiResult.data.phone,
                    email: geminiResult.data.email,
                    dateOfBirth: geminiResult.data.dateOfBirth,
                    gender: geminiResult.data.gender,
                    address: geminiResult.data.address,
                    emergencyContact: null,
                    aadhaar: geminiResult.data.aadhaar,
                    pan: geminiResult.data.pan,
                    confidence: geminiResult.data.confidence,
                };
                overallConfidence = geminiService.calculateOverallConfidence(geminiResult.data.confidence);

                logger.success('[scanDocument] Gemini extraction successful');
            } else {
                // Gemini failed, fall back to Vision + regex
                logger.warn('[scanDocument] Gemini failed, falling back to Vision API:', geminiResult.message);
                extractionMethod = 'vision-fallback';

                const fallbackResult = await fallbackToVisionExtraction(imageBuffer);
                extractedData = fallbackResult.data;
                overallConfidence = fallbackResult.confidence;
                textLength = fallbackResult.textLength;
            }
        } else {
            // Gemini not available, use Vision + regex
            logger.log('[scanDocument] Gemini not configured, using Vision API');
            extractionMethod = 'vision';

            const visionResult = await fallbackToVisionExtraction(imageBuffer);
            extractedData = visionResult.data;
            overallConfidence = visionResult.confidence;
            textLength = visionResult.textLength;
        }

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
            textLength,
            documentType: extractionMethod,
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
                textLength,
                quotaRemaining: quota.remaining - 1,
            },
        };
    } catch (error) {
        logger.error('[scanDocument] Error:', error);

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
 * Fallback extraction using Google Vision API + regex
 */
async function fallbackToVisionExtraction(imageBuffer: Buffer): Promise<{
    data: ExtractedMemberData;
    confidence: number;
    textLength: number;
}> {
    const ocrResult = await googleVisionService.detectText(imageBuffer);

    if (!ocrResult.success) {
        // Return empty data on failure
        return {
            data: {
                name: null,
                phone: null,
                email: null,
                dateOfBirth: null,
                gender: null,
                address: null,
                emergencyContact: null,
                aadhaar: null,
                pan: null,
                confidence: {
                    name: 0,
                    phone: 0,
                    email: 0,
                    dateOfBirth: 0,
                    gender: 0,
                    address: 0,
                    aadhaar: 0,
                    pan: 0,
                },
            },
            confidence: 0,
            textLength: 0,
        };
    }

    const extractedData = dataExtractionService.extractMemberData(ocrResult.fullText || '');
    const confidence = dataExtractionService.calculateOverallConfidence(extractedData.confidence);

    return {
        data: extractedData,
        confidence,
        textLength: ocrResult.textLength || 0,
    };
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
        // Extended fields
        aadhaarNumber?: string | null;
        panNumber?: string | null;
        notes?: string | null;
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

        // Clean and format phone number
        const cleanPhone = memberData.phone.replace(/\D/g, '').slice(-10);
        const formattedPhone = cleanPhone.startsWith('+91') ? cleanPhone : `+91 ${cleanPhone}`;

        // Check for duplicate by phone
        const { data: existing } = await supabase
            .from('members')
            .select('id, name')
            .ilike('phone', `%${cleanPhone}%`)
            .limit(1)
            .maybeSingle();

        if (existing) {
            return {
                success: false,
                error: `Member with this phone number already exists: ${existing.name}`,
            };
        }

        // Get plan details
        const { data: plan } = await supabase
            .from('plans')
            .select('name')
            .eq('id', memberData.planId)
            .single();

        // Build insert data
        const insertData: Record<string, unknown> = {
            name: memberData.name,
            phone: formattedPhone,
            email: memberData.email || null,
            plan_id: memberData.planId,
            plan: plan?.name || 'Unknown',
            start_date: memberData.startDate,
            expiry_date: memberData.expiryDate,
            ocr_scanned: true,
            ocr_confidence_score: memberData.overallConfidence || 0,
            scanned_at: new Date().toISOString(),
        };

        // Add optional fields if provided
        if (memberData.gender) insertData.gender = memberData.gender;
        if (memberData.dateOfBirth) insertData.date_of_birth = memberData.dateOfBirth;
        if (memberData.address) insertData.address = memberData.address;
        if (memberData.aadhaarNumber) insertData.aadhaar_number = memberData.aadhaarNumber;
        if (memberData.panNumber) insertData.pan_number = memberData.panNumber;
        if (memberData.notes) insertData.notes = memberData.notes;

        // Insert new member
        const { data: newMember, error } = await supabase
            .from('members')
            .insert(insertData)
            .select('id')
            .single();

        if (error) {
            logger.error('[saveMemberFromOCR] Error:', error);
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
        logger.error('[saveMemberFromOCR] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save member',
        };
    }
}
