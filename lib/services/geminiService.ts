/**
 * Gemini AI Service
 * Handles AI-powered handwriting recognition using Google Gemini Vision API
 * 
 * This service uses Gemini's multimodal capabilities to extract structured
 * member information from handwritten gym membership cards.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/utils/logger';

// Types for extracted member data
export interface GeminiExtractedData {
    name: string | null;
    phone: string | null;
    email: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    address: string | null;
    aadhaar: string | null;
    pan: string | null;
    memberNumber: string | null;
    confidence: {
        name: number;
        phone: number;
        email: number;
        dateOfBirth: number;
        gender: number;
        address: number;
        aadhaar: number;
        pan: number;
    };
}

export interface GeminiExtractionResult {
    success: boolean;
    data?: GeminiExtractedData;
    processingTime?: number;
    error?: string;
    message?: string;
}

class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            // Use gemini-2.0-flash-lite for better rate limits on free tier
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
            logger.log('[GeminiService] Initialized with API key');
        } else {
            logger.warn('[GeminiService] No API key configured');
        }
    }

    /**
     * Check if Gemini service is available
     */
    isAvailable(): boolean {
        return this.model !== null;
    }

    /**
     * Extract member details from membership card image using Gemini Vision
     */
    async extractMemberDetails(imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<GeminiExtractionResult> {
        const startTime = Date.now();

        try {
            if (!this.model) {
                return {
                    success: false,
                    error: 'NO_API_KEY',
                    message: 'Gemini API key not configured',
                };
            }

            // Convert buffer to base64
            const base64Image = imageBuffer.toString('base64');

            // Craft the extraction prompt - optimized for Indian gym cards
            const prompt = `
You are an expert OCR system reading an Indian gym membership card.

CRITICAL INSTRUCTIONS:
1. Read EVERY piece of text visible - both printed AND handwritten
2. Extract the EXACT text you see - DO NOT make up or assume any information
3. If you cannot read something clearly, return null for that field
4. Pay special attention to:
   - Member name (usually handwritten in "NAME:" field)
   - Phone numbers (often printed at top, may be multiple numbers)
   - Address (usually handwritten)
   - Member/Card number
   - Any dates visible
5. DO NOT generate fake data - only return what you actually see on the card

Return ONLY a JSON object with this EXACT structure:
{
  "name": "exact name from NAME field or null",
  "phone": "10-digit phone number or null",
  "email": null,
  "gender": "Male" or "Female" or null,
  "dateOfBirth": "YYYY-MM-DD format or null",
  "aadhaar": "12-digit number or null",
  "pan": "10-char PAN or null",
  "memberNumber": "member/card number or null",
  "address": "exact address text or null",
  "confidence": {
    "name": 0.0 to 1.0,
    "phone": 0.0 to 1.0,
    "email": 0.0 to 1.0,
    "gender": 0.0 to 1.0,
    "dateOfBirth": 0.0 to 1.0,
    "aadhaar": 0.0 to 1.0,
    "pan": 0.0 to 1.0,
    "address": 0.0 to 1.0
  }
}

Confidence scoring:
- 0.9-1.0: Very clear, definitely correct
- 0.7-0.9: Reasonably clear
- 0.5-0.7: Somewhat unclear
- Below 0.5: Unclear/guess
- 0: Field not found

IMPORTANT: Return ONLY the JSON object. No explanations, no markdown, no backticks.
`;

            // Call Gemini API with image
            const result = await this.model.generateContent([
                prompt,
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Image,
                    },
                },
            ]);

            const response = await result.response;
            const text = response.text();

            logger.log('[GeminiService] Raw response length:', text.length);

            // Extract JSON from response (handle potential markdown wrapping)
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                logger.error('[GeminiService] Could not extract JSON from response:', text.substring(0, 200));
                return {
                    success: false,
                    error: 'PARSE_ERROR',
                    message: 'Could not extract structured data from image',
                    processingTime: Date.now() - startTime,
                };
            }

            const extractedData = JSON.parse(jsonMatch[0]);

            // Clean and validate the extracted data
            const cleanedData = this.cleanExtractedData(extractedData);

            logger.success('[GeminiService] Successfully extracted data:', Object.keys(cleanedData).filter(k => k !== 'confidence' && cleanedData[k as keyof GeminiExtractedData]).length, 'fields');

            return {
                success: true,
                data: cleanedData,
                processingTime: Date.now() - startTime,
            };

        } catch (error) {
            logger.error('[GeminiService] Extraction error:', error);

            return {
                success: false,
                error: 'PROCESSING_ERROR',
                message: error instanceof Error ? error.message : 'Failed to process image with Gemini',
                processingTime: Date.now() - startTime,
            };
        }
    }

    /**
     * Clean and validate extracted data
     */
    private cleanExtractedData(data: Record<string, unknown>): GeminiExtractedData {
        return {
            name: this.cleanName(data.name as string | null),
            phone: this.cleanPhoneNumber(data.phone as string | null),
            email: this.cleanEmail(data.email as string | null),
            dateOfBirth: this.cleanDate(data.dateOfBirth as string | null),
            gender: this.cleanGender(data.gender as string | null),
            address: this.cleanAddress(data.address as string | null),
            aadhaar: this.cleanAadhaar(data.aadhaar as string | null),
            pan: this.cleanPAN(data.pan as string | null),
            memberNumber: data.memberNumber?.toString() || null,
            confidence: {
                name: this.normalizeConfidence(data.confidence, 'name'),
                phone: this.normalizeConfidence(data.confidence, 'phone'),
                email: this.normalizeConfidence(data.confidence, 'email'),
                dateOfBirth: this.normalizeConfidence(data.confidence, 'dateOfBirth'),
                gender: this.normalizeConfidence(data.confidence, 'gender'),
                address: this.normalizeConfidence(data.confidence, 'address'),
                aadhaar: this.normalizeConfidence(data.confidence, 'aadhaar'),
                pan: this.normalizeConfidence(data.confidence, 'pan'),
            },
        };
    }

    /**
     * Clean name - trim and validate
     */
    private cleanName(name: string | null): string | null {
        if (!name) return null;
        const cleaned = name.trim();
        // Must have at least 2 characters
        return cleaned.length >= 2 ? cleaned : null;
    }

    /**
     * Clean phone number - extract 10 digits
     */
    private cleanPhoneNumber(phone: string | null): string | null {
        if (!phone) return null;
        // Remove all non-digits
        const digits = phone.toString().replace(/\D/g, '');
        // If starts with 91 and has 12 digits, remove country code
        if (digits.length === 12 && digits.startsWith('91')) {
            return '+91 ' + digits.slice(2);
        }
        // Valid 10-digit Indian mobile
        if (digits.length === 10 && /^[6-9]/.test(digits)) {
            return '+91 ' + digits;
        }
        return null;
    }

    /**
     * Clean and validate email
     */
    private cleanEmail(email: string | null): string | null {
        if (!email) return null;
        const cleaned = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(cleaned) ? cleaned : null;
    }

    /**
     * Clean and validate date (YYYY-MM-DD format)
     */
    private cleanDate(date: string | null): string | null {
        if (!date) return null;
        // Check if already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }
        // Try to parse DD/MM/YYYY format
        const parts = date.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
        if (parts) {
            return `${parts[3]}-${parts[2]}-${parts[1]}`;
        }
        return null;
    }

    /**
     * Clean and validate gender
     */
    private cleanGender(gender: string | null): string | null {
        if (!gender) return null;
        const normalized = gender.toLowerCase().trim();
        if (normalized.includes('male') && !normalized.includes('female')) return 'Male';
        if (normalized.includes('female')) return 'Female';
        if (normalized === 'm') return 'Male';
        if (normalized === 'f') return 'Female';
        return 'Other';
    }

    /**
     * Clean address
     */
    private cleanAddress(address: string | null): string | null {
        if (!address) return null;
        const cleaned = address.trim().replace(/\s+/g, ' ');
        // Must be at least 10 characters
        return cleaned.length >= 10 ? cleaned : null;
    }

    /**
     * Clean Aadhaar number - must be 12 digits
     */
    private cleanAadhaar(aadhaar: string | null): string | null {
        if (!aadhaar) return null;
        const digits = aadhaar.toString().replace(/\D/g, '');
        if (digits.length === 12) {
            // Format with spaces: XXXX XXXX XXXX
            return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
        }
        return null;
    }

    /**
     * Clean PAN number - must be 10 alphanumeric (ABCDE1234F)
     */
    private cleanPAN(pan: string | null): string | null {
        if (!pan) return null;
        const cleaned = pan.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(cleaned) ? cleaned : null;
    }

    /**
     * Normalize confidence score from Gemini response
     */
    private normalizeConfidence(confidenceObj: unknown, field: string): number {
        if (!confidenceObj || typeof confidenceObj !== 'object') return 0;
        const conf = (confidenceObj as Record<string, number>)[field];
        if (typeof conf === 'number') {
            return Math.min(1, Math.max(0, conf));
        }
        return 0;
    }

    /**
     * Calculate overall confidence score
     */
    calculateOverallConfidence(confidence: GeminiExtractedData['confidence']): number {
        const scores = Object.values(confidence).filter(s => s > 0);
        if (scores.length === 0) return 0;
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    }
}

// Export singleton instance
export const geminiService = new GeminiService();
