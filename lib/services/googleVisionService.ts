/**
 * Google Vision Service
 * Handles OCR processing using Google Cloud Vision API
 */

// Note: In a production environment, this would use @google-cloud/vision
// For now, we'll create a mock implementation that can be swapped out

export interface OCRResult {
    success: boolean;
    fullText?: string;
    words?: Array<{
        text: string;
        bounds?: { x: number; y: number }[];
    }>;
    processingTime?: number;
    textLength?: number;
    error?: string;
    message?: string;
}

class GoogleVisionService {
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    }

    /**
     * Detect text in image using Google Cloud Vision API
     * Uses REST API with base64 encoded image
     */
    async detectText(imageBuffer: Buffer): Promise<OCRResult> {
        const startTime = Date.now();

        try {
            // Check if API key is configured
            if (!this.apiKey) {
                console.warn('[GoogleVision] No API key configured, using mock response');
                return this.getMockResponse(startTime);
            }

            // Convert buffer to base64
            const base64Image = imageBuffer.toString('base64');

            // Call Google Cloud Vision API
            const response = await fetch(
                `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        requests: [
                            {
                                image: {
                                    content: base64Image,
                                },
                                features: [
                                    {
                                        type: 'TEXT_DETECTION',
                                        maxResults: 50,
                                    },
                                ],
                            },
                        ],
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[GoogleVision] API error:', errorData);
                return {
                    success: false,
                    error: 'API_ERROR',
                    message: errorData.error?.message || 'Failed to process image',
                };
            }

            const data = await response.json();
            const annotations = data.responses?.[0]?.textAnnotations;

            if (!annotations || annotations.length === 0) {
                return {
                    success: false,
                    error: 'NO_TEXT_DETECTED',
                    message: 'No text found in the image',
                };
            }

            // First annotation contains full text
            const fullText = annotations[0].description;

            // Remaining annotations are individual words with positions
            const words = annotations.slice(1).map((annotation: { description: string; boundingPoly?: { vertices: { x: number; y: number }[] } }) => ({
                text: annotation.description,
                bounds: annotation.boundingPoly?.vertices,
            }));

            const processingTime = Date.now() - startTime;

            return {
                success: true,
                fullText,
                words,
                processingTime,
                textLength: fullText.length,
            };
        } catch (error) {
            console.error('[GoogleVision] Error:', error);

            return {
                success: false,
                error: 'PROCESSING_ERROR',
                message: error instanceof Error ? error.message : 'OCR processing failed',
            };
        }
    }

    /**
     * Mock response for development/testing without API key
     */
    private getMockResponse(startTime: number): OCRResult {
        const mockText = `GOVERNMENT OF INDIA
Aadhaar - आधार
Name: Rajesh Kumar Sharma
DOB: 15/08/1990
Gender: Male
Address: 123, MG Road, Sector 15
Bangalore, Karnataka 560001
Aadhaar No: 1234 5678 9012
Mobile: 9876543210
Email: rajesh.sharma@email.com`;

        return {
            success: true,
            fullText: mockText,
            words: mockText.split(/\s+/).map(word => ({ text: word })),
            processingTime: Date.now() - startTime,
            textLength: mockText.length,
        };
    }
}

// Export singleton instance
export const googleVisionService = new GoogleVisionService();
