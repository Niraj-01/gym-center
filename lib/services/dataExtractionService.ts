/**
 * Data Extraction Service
 * Extracts structured member data from raw OCR text
 */

export interface ExtractedMemberData {
    name: string | null;
    phone: string | null;
    email: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    address: string | null;
    emergencyContact: string | null;
    aadhaar: string | null;
    pan: string | null;
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

class DataExtractionService {
    /**
     * Extract structured member data from raw OCR text
     * Uses regex patterns to identify and extract specific fields
     */
    extractMemberData(text: string): ExtractedMemberData {
        const extracted: ExtractedMemberData = {
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
        };

        // Clean text - normalize whitespace
        const cleanText = text.replace(/\s+/g, ' ').trim();

        // Extract Name (multiple patterns)
        extracted.name = this.extractName(cleanText);
        extracted.confidence.name = extracted.name ? 0.85 : 0;

        // Extract Phone (Indian format)
        extracted.phone = this.extractPhone(cleanText);
        extracted.confidence.phone = extracted.phone ? 0.95 : 0;

        // Extract Email
        extracted.email = this.extractEmail(cleanText);
        extracted.confidence.email = extracted.email ? 0.95 : 0;

        // Extract Date of Birth
        extracted.dateOfBirth = this.extractDateOfBirth(cleanText);
        extracted.confidence.dateOfBirth = extracted.dateOfBirth ? 0.8 : 0;

        // Extract Gender
        extracted.gender = this.extractGender(cleanText);
        extracted.confidence.gender = extracted.gender ? 0.9 : 0;

        // Extract Address
        extracted.address = this.extractAddress(text); // Use original text for address
        extracted.confidence.address = extracted.address ? 0.7 : 0;

        // Extract Aadhaar
        extracted.aadhaar = this.extractAadhaar(cleanText);
        extracted.confidence.aadhaar = extracted.aadhaar ? 0.95 : 0;

        // Extract PAN
        extracted.pan = this.extractPAN(cleanText);
        extracted.confidence.pan = extracted.pan ? 0.95 : 0;

        return extracted;
    }

    private extractName(text: string): string | null {
        const patterns = [
            // "Name: John Doe" or "Full Name: John Doe"
            /(?:Name|Full\s*Name|नाम)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
            // "Mr./Mrs./Ms. John Doe"
            /(?:Mr\.|Mrs\.|Ms\.)\s*([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
            // Standalone name pattern (at start of line or after colon)
            /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/m,
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const name = match[1].trim();
                // Validate: should have at least first and last name
                if (name.split(/\s+/).length >= 2) {
                    return name;
                }
            }
        }
        return null;
    }

    private extractPhone(text: string): string | null {
        const patterns = [
            // With label: "Phone: 9876543210" or "Mobile: +91 9876543210"
            /(?:Phone|Mobile|Tel|Contact|Ph)[:\s]*(?:\+91)?[\s-]?([6-9]\d{9})/i,
            // Standalone 10-digit Indian mobile
            /(?:\+91)?[\s-]?([6-9]\d{9})/,
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return '+91 ' + match[1];
            }
        }
        return null;
    }

    private extractEmail(text: string): string | null {
        const pattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/;
        const match = text.match(pattern);
        return match ? match[1].toLowerCase() : null;
    }

    private extractDateOfBirth(text: string): string | null {
        const patterns = [
            // With label: "DOB: 15/08/1990" or "Date of Birth: 15-08-1990"
            /(?:DOB|Date\s*of\s*Birth|D\.O\.B|Birth\s*Date|जन्म\s*तिथि)[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})/i,
            // Standalone date pattern
            /(\d{2}[-/]\d{2}[-/]\d{4})/,
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                // Normalize to YYYY-MM-DD format
                const parts = match[1].split(/[-/]/);
                if (parts.length === 3) {
                    // Assume DD/MM/YYYY format
                    return `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            }
        }
        return null;
    }

    private extractGender(text: string): string | null {
        const pattern = /(?:Gender|Sex|लिंग)[:\s]*(Male|Female|M|F|MALE|FEMALE|पुरुष|महिला)/i;
        const match = text.match(pattern);

        if (match && match[1]) {
            const gender = match[1].toUpperCase();
            if (gender.startsWith('M') || gender === 'पुरुष') return 'Male';
            if (gender.startsWith('F') || gender === 'महिला') return 'Female';
        }
        return null;
    }

    private extractAddress(text: string): string | null {
        const patterns = [
            // With label - using [\s\S] instead of . with s flag for multiline matching
            /(?:Address|Addr|पता)[:\s]*([\s\S]+?)(?=(?:Phone|Mobile|Email|DOB|Pin|$))/i,
            // After S/O, D/O, C/O
            /(?:S\/O|D\/O|C\/O)[:\s]*[A-Za-z\s.]+[,\s]+([\s\S]+?)(?=(?:Pin|Mobile|Phone|$))/i,
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                let address = match[1].trim();
                address = address.replace(/\n/g, ', ').replace(/\s+/g, ' ');
                // Minimum address length check
                if (address.length > 20) {
                    return address;
                }
            }
        }
        return null;
    }

    private extractAadhaar(text: string): string | null {
        // Aadhaar is 12 digits, often formatted as XXXX XXXX XXXX
        const pattern = /(\d{4}\s?\d{4}\s?\d{4})/;
        const match = text.match(pattern);
        if (match && match[1]) {
            // Format with spaces
            const digits = match[1].replace(/\s/g, '');
            if (digits.length === 12) {
                return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
            }
        }
        return null;
    }

    private extractPAN(text: string): string | null {
        // PAN format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
        const pattern = /([A-Z]{5}[0-9]{4}[A-Z]{1})/;
        const match = text.match(pattern);
        return match ? match[1] : null;
    }

    /**
     * Calculate overall confidence score
     */
    calculateOverallConfidence(confidenceScores: Record<string, number>): number {
        const scores = Object.values(confidenceScores).filter((s) => s > 0);
        if (scores.length === 0) return 0;
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    }
}

// Export singleton instance
export const dataExtractionService = new DataExtractionService();
