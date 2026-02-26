/**
 * Register Extraction Service
 * Parses OCR output to extract structured gym register entries
 * Uses spatial analysis and regex patterns
 */

import { OCRWord } from './documentAIService';

export interface FieldValue<T> {
    value: T | null;
    confidence: number;
    original: string; // Original OCR text before cleanup
}

export interface RegisterEntry {
    id: string;
    rowIndex: number;
    name: FieldValue<string>;
    phone: FieldValue<string>;
    date: FieldValue<string>;
    amount: FieldValue<number>;
    status: FieldValue<'paid' | 'unpaid' | 'partial'>;
    notes: string | null;
    overallConfidence: number;
    requiresReview: boolean;
    lowConfidenceFields: string[];
    rowBounds: {
        minY: number;
        maxY: number;
    };
}

interface WordRow {
    words: OCRWord[];
    minY: number;
    maxY: number;
    centerY: number;
}

// Confidence threshold for auto-approval
const CONFIDENCE_THRESHOLD = 0.85;

class RegisterExtractionService {
    /**
     * Extract register entries from OCR words
     */
    extractEntries(words: OCRWord[], fullText: string): RegisterEntry[] {
        if (!words || words.length === 0) {
            // Fall back to text-based extraction if no word positions
            return this.extractFromText(fullText);
        }

        // Group words into rows based on Y-coordinate
        const rows = this.groupWordsIntoRows(words);

        // Filter out header/separator rows
        const dataRows = this.filterDataRows(rows);

        // Extract entries from each row
        const entries: RegisterEntry[] = [];
        let rowIndex = 0;

        for (const row of dataRows) {
            const entry = this.extractEntryFromRow(row, rowIndex);
            if (entry && this.isValidEntry(entry)) {
                entries.push(entry);
                rowIndex++;
            }
        }

        return entries;
    }

    /**
     * Group words into rows based on Y-coordinate proximity
     */
    private groupWordsIntoRows(words: OCRWord[]): WordRow[] {
        if (words.length === 0) return [];

        // Sort words by Y position
        const sortedWords = [...words].sort((a, b) => a.boundingBox.y - b.boundingBox.y);

        const rows: WordRow[] = [];
        let currentRow: OCRWord[] = [sortedWords[0]];
        let currentMinY = sortedWords[0].boundingBox.y;
        let currentMaxY = sortedWords[0].boundingBox.y + sortedWords[0].boundingBox.height;

        const ROW_TOLERANCE = 15; // Pixels tolerance for same row

        for (let i = 1; i < sortedWords.length; i++) {
            const word = sortedWords[i];
            const wordY = word.boundingBox.y;

            // Check if word is on the same row
            if (Math.abs(wordY - currentMinY) <= ROW_TOLERANCE) {
                currentRow.push(word);
                currentMaxY = Math.max(currentMaxY, wordY + word.boundingBox.height);
            } else {
                // Start new row
                if (currentRow.length > 0) {
                    // Sort row words by X position
                    currentRow.sort((a, b) => a.boundingBox.x - b.boundingBox.x);
                    rows.push({
                        words: currentRow,
                        minY: currentMinY,
                        maxY: currentMaxY,
                        centerY: (currentMinY + currentMaxY) / 2,
                    });
                }
                currentRow = [word];
                currentMinY = wordY;
                currentMaxY = wordY + word.boundingBox.height;
            }
        }

        // Add last row
        if (currentRow.length > 0) {
            currentRow.sort((a, b) => a.boundingBox.x - b.boundingBox.x);
            rows.push({
                words: currentRow,
                minY: currentMinY,
                maxY: currentMaxY,
                centerY: (currentMinY + currentMaxY) / 2,
            });
        }

        return rows;
    }

    /**
     * Filter out header and separator rows
     */
    private filterDataRows(rows: WordRow[]): WordRow[] {
        return rows.filter(row => {
            const text = row.words.map(w => w.text).join(' ').toLowerCase();

            // Skip header rows
            if (text.includes('name') && text.includes('phone')) return false;
            if (text.includes('sr.') && text.includes('date')) return false;
            if (text.includes('register')) return false;

            // Skip separator lines (mostly dashes)
            if (/^[-=]+$/.test(text.replace(/\s/g, ''))) return false;

            // Must have at least 2 words to be a data row
            if (row.words.length < 2) return false;

            return true;
        });
    }

    /**
     * Extract a single entry from a row of words
     */
    private extractEntryFromRow(row: WordRow, rowIndex: number): RegisterEntry | null {
        const rowText = row.words.map(w => w.text).join(' ');
        const avgConfidence = row.words.reduce((sum, w) => sum + w.confidence, 0) / row.words.length;

        // Extract name (typically at the start, 1-3 words after serial number)
        const name = this.extractName(row.words);

        // Extract phone number
        const phone = this.extractPhone(row.words);

        // Extract date
        const date = this.extractDate(row.words);

        // Extract amount
        const amount = this.extractAmount(row.words);

        // Extract payment status
        const status = this.extractStatus(row.words);

        // Determine low confidence fields
        const lowConfidenceFields: string[] = [];
        if (name.confidence < CONFIDENCE_THRESHOLD) lowConfidenceFields.push('name');
        if (phone.confidence < CONFIDENCE_THRESHOLD) lowConfidenceFields.push('phone');
        if (date.confidence < CONFIDENCE_THRESHOLD) lowConfidenceFields.push('date');
        if (amount.confidence < CONFIDENCE_THRESHOLD) lowConfidenceFields.push('amount');
        if (status.confidence < CONFIDENCE_THRESHOLD && status.value) lowConfidenceFields.push('status');

        // Calculate overall confidence
        const fieldConfidences = [name.confidence, phone.confidence, date.confidence, amount.confidence];
        if (status.value) fieldConfidences.push(status.confidence);
        const overallConfidence = fieldConfidences.reduce((a, b) => a + b, 0) / fieldConfidences.length;

        // Determine if requires review (any critical field below threshold)
        const criticalFields = ['name', 'phone', 'amount'];
        const requiresReview = criticalFields.some(f => lowConfidenceFields.includes(f)) ||
            overallConfidence < CONFIDENCE_THRESHOLD;

        return {
            id: `row-${rowIndex}-${Date.now()}`,
            rowIndex,
            name,
            phone,
            date,
            amount,
            status,
            notes: null,
            overallConfidence: parseFloat(overallConfidence.toFixed(2)),
            requiresReview,
            lowConfidenceFields,
            rowBounds: {
                minY: row.minY,
                maxY: row.maxY,
            },
        };
    }

    /**
     * Extract name from row words
     */
    private extractName(words: OCRWord[]): FieldValue<string> {
        // Look for name-like patterns (capitalized words, 2-3 consecutive)
        const nameWords: OCRWord[] = [];
        let foundSerialNumber = false;

        for (const word of words) {
            // Skip serial numbers
            if (/^\d{1,2}\.?$/.test(word.text)) {
                foundSerialNumber = true;
                continue;
            }

            // Skip phone numbers
            if (/^\d{10}$/.test(word.text)) continue;

            // Skip dates
            if (/^\d{1,2}\/\d{1,2}\/?\d{0,4}$/.test(word.text)) continue;

            // Skip amounts (numbers with or without currency)
            if (/^[₹$]?\d+$/.test(word.text)) continue;

            // Skip status words
            if (/^(paid|unpaid|partial)$/i.test(word.text)) continue;

            // Collect potential name words (after serial number)
            if (foundSerialNumber && /^[A-Z][a-z]+$/.test(word.text)) {
                nameWords.push(word);
                if (nameWords.length >= 3) break;
            } else if (!foundSerialNumber && nameWords.length === 0 && /^[A-Z][a-z]+$/.test(word.text)) {
                nameWords.push(word);
            }
        }

        if (nameWords.length === 0) {
            return { value: null, confidence: 0, original: '' };
        }

        const name = nameWords.map(w => w.text).join(' ');
        const avgConfidence = nameWords.reduce((sum, w) => sum + w.confidence, 0) / nameWords.length;

        return {
            value: name,
            confidence: avgConfidence,
            original: name,
        };
    }

    /**
     * Extract phone number from row words
     */
    private extractPhone(words: OCRWord[]): FieldValue<string> {
        // Look for 10-digit Indian mobile number
        for (const word of words) {
            const cleaned = word.text.replace(/[-\s]/g, '');

            // Check for 10-digit number starting with 6-9
            if (/^[6-9]\d{9}$/.test(cleaned)) {
                return {
                    value: cleaned,
                    confidence: word.confidence,
                    original: word.text,
                };
            }

            // Check for number with country code
            if (/^\+?91[6-9]\d{9}$/.test(cleaned)) {
                return {
                    value: cleaned.slice(-10),
                    confidence: word.confidence,
                    original: word.text,
                };
            }
        }

        // Try combining adjacent digit words
        const digitWords = words.filter(w => /^\d+$/.test(w.text));
        const combined = digitWords.map(w => w.text).join('');
        if (/[6-9]\d{9}/.test(combined)) {
            const match = combined.match(/[6-9]\d{9}/);
            if (match) {
                const avgConfidence = digitWords.reduce((sum, w) => sum + w.confidence, 0) / digitWords.length;
                return {
                    value: match[0],
                    confidence: avgConfidence * 0.9, // Slightly lower confidence for combined
                    original: combined,
                };
            }
        }

        return { value: null, confidence: 0, original: '' };
    }

    /**
     * Extract date from row words
     */
    private extractDate(words: OCRWord[]): FieldValue<string> {
        for (const word of words) {
            // Check for DD/MM/YY or DD/MM/YYYY format
            const dateMatch = word.text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/);
            if (dateMatch) {
                const [, day, month, rawYear] = dateMatch;

                // Default to current year if not provided
                let year = rawYear || new Date().getFullYear().toString().slice(-2);

                // Convert 2-digit year to 4-digit
                if (year.length === 2) {
                    year = (parseInt(year) > 50 ? '19' : '20') + year;
                }

                // Validate and format
                const dayNum = parseInt(day);
                const monthNum = parseInt(month);
                if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
                    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    return {
                        value: formattedDate,
                        confidence: word.confidence,
                        original: word.text,
                    };
                }
            }
        }

        return { value: null, confidence: 0, original: '' };
    }

    /**
     * Extract amount from row words
     */
    private extractAmount(words: OCRWord[]): FieldValue<number> {
        for (const word of words) {
            // Remove currency symbols and check for number
            const cleaned = word.text.replace(/[₹$,]/g, '');

            // Look for reasonable amount (100 - 100000)
            if (/^\d+$/.test(cleaned)) {
                const amount = parseInt(cleaned);
                if (amount >= 100 && amount <= 100000) {
                    return {
                        value: amount,
                        confidence: word.confidence,
                        original: word.text,
                    };
                }
            }
        }

        return { value: null, confidence: 0, original: '' };
    }

    /**
     * Extract payment status from row words
     */
    private extractStatus(words: OCRWord[]): FieldValue<'paid' | 'unpaid' | 'partial'> {
        for (const word of words) {
            const text = word.text.toLowerCase();

            if (text === 'paid' || text === 'pd') {
                return { value: 'paid', confidence: word.confidence, original: word.text };
            }
            if (text === 'unpaid' || text === 'up' || text === 'due') {
                return { value: 'unpaid', confidence: word.confidence, original: word.text };
            }
            if (text === 'partial' || text === 'part') {
                return { value: 'partial', confidence: word.confidence, original: word.text };
            }
        }

        return { value: null, confidence: 0, original: '' };
    }

    /**
     * Check if entry has minimum required fields
     */
    private isValidEntry(entry: RegisterEntry): boolean {
        // Must have at least name or phone
        return entry.name.value !== null || entry.phone.value !== null;
    }

    /**
     * Fallback: Extract entries from plain text when no bounding boxes available
     */
    private extractFromText(text: string): RegisterEntry[] {
        const entries: RegisterEntry[] = [];
        const lines = text.split('\n').filter(line => line.trim().length > 0);

        let rowIndex = 0;
        for (const line of lines) {
            // Skip headers and separators
            if (/name|phone|register|^[-=]+$/i.test(line)) continue;

            // Try to extract data from line
            const entry = this.extractEntryFromText(line, rowIndex);
            if (entry && this.isValidEntry(entry)) {
                entries.push(entry);
                rowIndex++;
            }
        }

        return entries;
    }

    /**
     * Extract entry from a single line of text
     */
    private extractEntryFromText(line: string, rowIndex: number): RegisterEntry | null {
        // Default confidence for text-only extraction (lower than with bounding boxes)
        const defaultConfidence = 0.7;

        // Extract phone
        const phoneMatch = line.match(/[6-9]\d{9}/);
        const phone: FieldValue<string> = phoneMatch
            ? { value: phoneMatch[0], confidence: defaultConfidence, original: phoneMatch[0] }
            : { value: null, confidence: 0, original: '' };

        // Extract date
        const dateMatch = line.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/);
        let date: FieldValue<string> = { value: null, confidence: 0, original: '' };
        if (dateMatch) {
            const [fullMatch, day, month, rawYear] = dateMatch;
            let year = rawYear || new Date().getFullYear().toString().slice(-2);
            if (year.length === 2) year = (parseInt(year) > 50 ? '19' : '20') + year;
            date = {
                value: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
                confidence: defaultConfidence,
                original: fullMatch,
            };
        }

        // Extract amount
        const amountMatch = line.match(/[₹$]?(\d{3,6})/);
        const amount: FieldValue<number> = amountMatch
            ? { value: parseInt(amountMatch[1]), confidence: defaultConfidence, original: amountMatch[0] }
            : { value: null, confidence: 0, original: '' };

        // Extract status
        let status: FieldValue<'paid' | 'unpaid' | 'partial'> = { value: null, confidence: 0, original: '' };
        if (/paid/i.test(line)) status = { value: 'paid', confidence: defaultConfidence, original: 'Paid' };
        else if (/unpaid|due/i.test(line)) status = { value: 'unpaid', confidence: defaultConfidence, original: 'Unpaid' };
        else if (/partial/i.test(line)) status = { value: 'partial', confidence: defaultConfidence, original: 'Partial' };

        // Extract name (words that aren't numbers or status)
        const nameParts = line
            .replace(/\d+/g, ' ')
            .replace(/(paid|unpaid|partial)/gi, ' ')
            .split(/\s+/)
            .filter(w => w.length > 1 && /^[A-Za-z]+$/.test(w));

        const name: FieldValue<string> = nameParts.length > 0
            ? { value: nameParts.slice(0, 3).join(' '), confidence: defaultConfidence * 0.8, original: nameParts.join(' ') }
            : { value: null, confidence: 0, original: '' };

        // Calculate overall confidence
        const fields = [name, phone, date, amount].filter(f => f.value !== null);
        const overallConfidence = fields.length > 0
            ? fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length
            : 0;

        // Determine low confidence fields
        const lowConfidenceFields: string[] = [];
        if (name.confidence < CONFIDENCE_THRESHOLD) lowConfidenceFields.push('name');
        if (phone.confidence < CONFIDENCE_THRESHOLD) lowConfidenceFields.push('phone');
        if (date.confidence < CONFIDENCE_THRESHOLD) lowConfidenceFields.push('date');
        if (amount.confidence < CONFIDENCE_THRESHOLD) lowConfidenceFields.push('amount');

        return {
            id: `text-${rowIndex}-${Date.now()}`,
            rowIndex,
            name,
            phone,
            date,
            amount,
            status,
            notes: null,
            overallConfidence: parseFloat(overallConfidence.toFixed(2)),
            requiresReview: true, // Always require review for text-only extraction
            lowConfidenceFields,
            rowBounds: { minY: 0, maxY: 0 },
        };
    }
}

// Export singleton instance
export const registerExtractionService = new RegisterExtractionService();
