'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { documentAIService, DocumentAIResult } from '@/lib/services/documentAIService';
import { registerExtractionService, RegisterEntry } from '@/lib/services/registerExtractionService';

// Types
export interface UploadResult {
    success: boolean;
    documentId?: number;
    storageUrl?: string;
    error?: string;
    message?: string;
}

export interface ProcessingResult {
    success: boolean;
    documentId?: number;
    entriesFound?: number;
    autoApproved?: number;
    pendingReview?: number;
    entries?: RegisterEntry[];
    error?: string;
    message?: string;
}

export interface VerificationQueueItem {
    id: number;
    document_id: number;
    row_index: number;
    name: string | null;
    name_confidence: number;
    phone: string | null;
    phone_confidence: number;
    entry_date: string | null;
    date_confidence: number;
    amount: number | null;
    amount_confidence: number;
    payment_status: string | null;
    status_confidence: number;
    overall_confidence: number;
    low_confidence_fields: string[] | null;
    requires_review: boolean;
    review_status: string;
    row_bounds_min_y: number | null;
    row_bounds_max_y: number | null;
    storage_url: string;
    filename: string;
    original_filename: string;
}

export interface ApproveResult {
    success: boolean;
    memberId?: number;
    error?: string;
}

/**
 * Upload a register document to storage
 */
export async function uploadRegisterDocument(
    formData: FormData,
    userId: string
): Promise<UploadResult> {
    try {
        const file = formData.get('document') as File | null;

        if (!file) {
            return { success: false, error: 'NO_FILE', message: 'No document provided' };
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            return { success: false, error: 'INVALID_TYPE', message: 'Unsupported file type' };
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return { success: false, error: 'FILE_TOO_LARGE', message: 'File size exceeds 10MB limit' };
        }

        const supabase = await createClient();

        // Generate unique filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop() || 'jpg';
        const filename = `register_${timestamp}.${extension}`;
        const storagePath = `registers/${userId}/${filename}`;

        // Upload to Supabase Storage
        const arrayBuffer = await file.arrayBuffer();
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('register-scans')
            .upload(storagePath, arrayBuffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('[uploadRegisterDocument] Storage error:', uploadError);

            // If bucket doesn't exist, try to create it
            if (uploadError.message.includes('not found')) {
                return {
                    success: false,
                    error: 'STORAGE_NOT_CONFIGURED',
                    message: 'Storage bucket "register-scans" not found. Please create it in Supabase Dashboard.',
                };
            }

            return { success: false, error: 'UPLOAD_FAILED', message: uploadError.message };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('register-scans')
            .getPublicUrl(storagePath);

        const storageUrl = urlData.publicUrl;

        // Create database record
        const { data: docData, error: dbError } = await supabase
            .from('scanned_documents')
            .insert({
                filename,
                original_filename: file.name,
                storage_url: storageUrl,
                storage_path: storagePath,
                file_type: extension.toLowerCase(),
                file_size_bytes: file.size,
                ocr_status: 'pending',
                created_by: userId,
            })
            .select('id')
            .single();

        if (dbError) {
            console.error('[uploadRegisterDocument] Database error:', dbError);
            return { success: false, error: 'DB_ERROR', message: dbError.message };
        }

        return {
            success: true,
            documentId: docData.id,
            storageUrl,
        };
    } catch (error) {
        console.error('[uploadRegisterDocument] Error:', error);
        return {
            success: false,
            error: 'UNKNOWN_ERROR',
            message: error instanceof Error ? error.message : 'Failed to upload document',
        };
    }
}

/**
 * Process a document with OCR and extract register entries
 */
export async function processRegisterDocument(
    documentId: number,
    userId: string
): Promise<ProcessingResult> {
    const startTime = Date.now();
    const supabase = await createClient();

    try {
        // Get document info
        const { data: doc, error: docError } = await supabase
            .from('scanned_documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (docError || !doc) {
            return { success: false, error: 'NOT_FOUND', message: 'Document not found' };
        }

        // Update status to processing
        await supabase
            .from('scanned_documents')
            .update({ ocr_status: 'processing', ocr_started_at: new Date().toISOString() })
            .eq('id', documentId);

        // Download image from storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('register-scans')
            .download(doc.storage_path);

        if (downloadError || !fileData) {
            await logProcessingError(supabase, documentId, 'DOWNLOAD_FAILED', downloadError?.message);
            return { success: false, error: 'DOWNLOAD_FAILED', message: 'Failed to download document' };
        }

        // Convert to buffer
        const arrayBuffer = await fileData.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        // Process with Document AI
        const ocrResult: DocumentAIResult = await documentAIService.processDocument(imageBuffer);

        if (!ocrResult.success) {
            await logProcessingError(supabase, documentId, ocrResult.error || 'OCR_FAILED', ocrResult.message);
            await supabase
                .from('scanned_documents')
                .update({ ocr_status: 'failed', ocr_error_message: ocrResult.message })
                .eq('id', documentId);

            return { success: false, error: ocrResult.error, message: ocrResult.message };
        }

        // Extract register entries
        const entries = registerExtractionService.extractEntries(
            ocrResult.words || [],
            ocrResult.fullText || ''
        );

        // Count auto-approved vs pending review
        const autoApproved = entries.filter(e => !e.requiresReview).length;
        const pendingReview = entries.filter(e => e.requiresReview).length;

        // Save entries to database
        for (const entry of entries) {
            await supabase.from('register_entries').insert({
                document_id: documentId,
                row_index: entry.rowIndex,
                name: entry.name.value,
                name_confidence: entry.name.confidence,
                name_original: entry.name.original,
                phone: entry.phone.value,
                phone_confidence: entry.phone.confidence,
                phone_original: entry.phone.original,
                entry_date: entry.date.value,
                date_confidence: entry.date.confidence,
                date_original: entry.date.original,
                amount: entry.amount.value,
                amount_confidence: entry.amount.confidence,
                amount_original: entry.amount.original,
                payment_status: entry.status.value,
                status_confidence: entry.status.confidence,
                status_original: entry.status.original,
                overall_confidence: entry.overallConfidence,
                low_confidence_fields: entry.lowConfidenceFields,
                requires_review: entry.requiresReview,
                review_status: entry.requiresReview ? 'pending' : 'approved',
                row_bounds_min_y: entry.rowBounds.minY,
                row_bounds_max_y: entry.rowBounds.maxY,
            });
        }

        // Update document with results
        await supabase
            .from('scanned_documents')
            .update({
                ocr_status: 'completed',
                ocr_completed_at: new Date().toISOString(),
                raw_ocr_response: ocrResult.rawResponse || null,
                full_extracted_text: ocrResult.fullText,
                entries_extracted: entries.length,
                auto_approved_count: autoApproved,
                pending_review_count: pendingReview,
            })
            .eq('id', documentId);

        // Log success
        await supabase.from('ocr_processing_logs').insert({
            document_id: documentId,
            status: 'success',
            processing_time_ms: Date.now() - startTime,
            words_detected: ocrResult.words?.length || 0,
            entries_found: entries.length,
            processor_type: ocrResult.processorType,
            raw_response_size_bytes: JSON.stringify(ocrResult.rawResponse || {}).length,
        });

        revalidatePath('/register/verify');

        return {
            success: true,
            documentId,
            entriesFound: entries.length,
            autoApproved,
            pendingReview,
            entries,
        };
    } catch (error) {
        console.error('[processRegisterDocument] Error:', error);
        await logProcessingError(supabase, documentId, 'PROCESSING_ERROR', error instanceof Error ? error.message : 'Unknown error');

        await supabase
            .from('scanned_documents')
            .update({ ocr_status: 'failed', ocr_error_message: 'Processing error' })
            .eq('id', documentId);

        return {
            success: false,
            error: 'PROCESSING_ERROR',
            message: error instanceof Error ? error.message : 'Failed to process document',
        };
    }
}

/**
 * Log processing error
 */
async function logProcessingError(
    supabase: Awaited<ReturnType<typeof createClient>>,
    documentId: number,
    errorType: string,
    errorMessage?: string
) {
    await supabase.from('ocr_processing_logs').insert({
        document_id: documentId,
        status: 'failed',
        error_type: errorType,
        error_message: errorMessage,
    });
}

/**
 * Get verification queue
 */
export async function getVerificationQueue(
    limit: number = 50,
    offset: number = 0
): Promise<{ data: VerificationQueueItem[]; total: number; error?: string }> {
    try {
        const supabase = await createClient();

        // Get total count
        const { count } = await supabase
            .from('register_entries')
            .select('*', { count: 'exact', head: true })
            .eq('review_status', 'pending')
            .eq('requires_review', true);

        // Get items
        const { data, error } = await supabase
            .from('register_entries')
            .select(`
        id,
        document_id,
        row_index,
        name,
        name_confidence,
        phone,
        phone_confidence,
        entry_date,
        date_confidence,
        amount,
        amount_confidence,
        payment_status,
        status_confidence,
        overall_confidence,
        low_confidence_fields,
        requires_review,
        review_status,
        row_bounds_min_y,
        row_bounds_max_y,
        scanned_documents!inner(
          storage_url,
          filename,
          original_filename
        )
      `)
            .eq('review_status', 'pending')
            .eq('requires_review', true)
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('[getVerificationQueue] Error:', error);
            return { data: [], total: 0, error: error.message };
        }

        // Transform data to flat structure
        const items: VerificationQueueItem[] = (data || []).map((item: Record<string, unknown>) => ({
            id: item.id as number,
            document_id: item.document_id as number,
            row_index: item.row_index as number,
            name: item.name as string | null,
            name_confidence: item.name_confidence as number,
            phone: item.phone as string | null,
            phone_confidence: item.phone_confidence as number,
            entry_date: item.entry_date as string | null,
            date_confidence: item.date_confidence as number,
            amount: item.amount as number | null,
            amount_confidence: item.amount_confidence as number,
            payment_status: item.payment_status as string | null,
            status_confidence: item.status_confidence as number,
            overall_confidence: item.overall_confidence as number,
            low_confidence_fields: item.low_confidence_fields as string[] | null,
            requires_review: item.requires_review as boolean,
            review_status: item.review_status as string,
            row_bounds_min_y: item.row_bounds_min_y as number | null,
            row_bounds_max_y: item.row_bounds_max_y as number | null,
            storage_url: (item.scanned_documents as { storage_url: string }).storage_url,
            filename: (item.scanned_documents as { filename: string }).filename,
            original_filename: (item.scanned_documents as { original_filename: string }).original_filename,
        }));

        return { data: items, total: count || 0 };
    } catch (error) {
        console.error('[getVerificationQueue] Error:', error);
        return { data: [], total: 0, error: 'Failed to load queue' };
    }
}

/**
 * Approve an entry and optionally create member record
 */
export async function approveEntry(
    entryId: number,
    updatedData: {
        name?: string;
        phone?: string;
        date?: string;
        amount?: number;
        status?: string;
    },
    userId: string,
    createMember: boolean = false
): Promise<ApproveResult> {
    try {
        const supabase = await createClient();

        // Update entry
        const updateData: Record<string, unknown> = {
            review_status: 'approved',
            verified_by: userId,
            verified_at: new Date().toISOString(),
        };

        if (updatedData.name) updateData.name = updatedData.name;
        if (updatedData.phone) updateData.phone = updatedData.phone;
        if (updatedData.date) updateData.entry_date = updatedData.date;
        if (updatedData.amount) updateData.amount = updatedData.amount;
        if (updatedData.status) updateData.payment_status = updatedData.status;

        const { error: updateError } = await supabase
            .from('register_entries')
            .update(updateData)
            .eq('id', entryId);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        // Optionally create member
        let memberId: number | undefined;
        if (createMember && updatedData.name && updatedData.phone) {
            const { data: memberData, error: memberError } = await supabase
                .from('members')
                .insert({
                    name: updatedData.name,
                    phone: updatedData.phone.startsWith('+91') ? updatedData.phone : `+91 ${updatedData.phone}`,
                    ocr_scanned: true,
                    scanned_at: new Date().toISOString(),
                })
                .select('id')
                .single();

            if (!memberError && memberData) {
                memberId = memberData.id;

                // Link entry to member
                await supabase
                    .from('register_entries')
                    .update({ member_id: memberId })
                    .eq('id', entryId);
            }
        }

        revalidatePath('/register/verify');
        revalidatePath('/members');

        return { success: true, memberId };
    } catch (error) {
        console.error('[approveEntry] Error:', error);
        return { success: false, error: 'Failed to approve entry' };
    }
}

/**
 * Skip an entry (move to next without approving)
 */
export async function skipEntry(entryId: number): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('register_entries')
            .update({ review_status: 'skipped' })
            .eq('id', entryId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/register/verify');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to skip entry' };
    }
}

/**
 * Reject an entry with reason
 */
export async function rejectEntry(
    entryId: number,
    reason: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('register_entries')
            .update({
                review_status: 'rejected',
                rejection_reason: reason,
                verified_by: userId,
                verified_at: new Date().toISOString(),
            })
            .eq('id', entryId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/register/verify');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to reject entry' };
    }
}

/**
 * Get scanned documents list
 */
export async function getScannedDocuments(
    limit: number = 20,
    offset: number = 0
): Promise<{ data: Record<string, unknown>[]; total: number; error?: string }> {
    try {
        const supabase = await createClient();

        const { count } = await supabase
            .from('scanned_documents')
            .select('*', { count: 'exact', head: true });

        const { data, error } = await supabase
            .from('scanned_documents')
            .select('*')
            .order('upload_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return { data: [], total: 0, error: error.message };
        }

        return { data: data || [], total: count || 0 };
    } catch (error) {
        return { data: [], total: 0, error: 'Failed to load documents' };
    }
}

/**
 * Get verification statistics
 */
export async function getVerificationStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    skipped: number;
    documents: number;
    avgConfidence: number;
}> {
    try {
        const supabase = await createClient();

        const { data: entries } = await supabase
            .from('register_entries')
            .select('review_status, overall_confidence');

        const { count: docCount } = await supabase
            .from('scanned_documents')
            .select('*', { count: 'exact', head: true });

        const stats = {
            pending: 0,
            approved: 0,
            rejected: 0,
            skipped: 0,
            documents: docCount || 0,
            avgConfidence: 0,
        };

        let totalConfidence = 0;
        for (const entry of entries || []) {
            if (entry.review_status === 'pending') stats.pending++;
            if (entry.review_status === 'approved') stats.approved++;
            if (entry.review_status === 'rejected') stats.rejected++;
            if (entry.review_status === 'skipped') stats.skipped++;
            totalConfidence += entry.overall_confidence || 0;
        }

        if (entries && entries.length > 0) {
            stats.avgConfidence = parseFloat((totalConfidence / entries.length).toFixed(2));
        }

        return stats;
    } catch (error) {
        console.error('[getVerificationStats] Error:', error);
        return { pending: 0, approved: 0, rejected: 0, skipped: 0, documents: 0, avgConfidence: 0 };
    }
}
