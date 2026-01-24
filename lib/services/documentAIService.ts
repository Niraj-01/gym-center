/**
 * Document AI Service
 * Handles OCR processing using Google Document AI or Google Vision API
 * Provides word-level bounding boxes and confidence scores
 */

export interface OCRWord {
    text: string;
    confidence: number;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface OCRBlock {
    text: string;
    confidence: number;
    words: OCRWord[];
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface DocumentAIResult {
    success: boolean;
    fullText?: string;
    words?: OCRWord[];
    blocks?: OCRBlock[];
    processingTime?: number;
    pageWidth?: number;
    pageHeight?: number;
    rawResponse?: object;
    error?: string;
    message?: string;
    processorType?: 'document_ai' | 'vision_api' | 'mock';
}

interface GoogleVisionWord {
    text: string;
    boundingPoly?: {
        vertices: Array<{ x: number; y: number }>;
    };
    confidence?: number;
}

interface GoogleVisionAnnotation {
    description: string;
    boundingPoly?: {
        vertices: Array<{ x: number; y: number }>;
    };
}

class DocumentAIService {
    private visionApiKey: string | undefined;
    private documentAiEndpoint: string | undefined;

    constructor() {
        this.visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
        this.documentAiEndpoint = process.env.GOOGLE_DOCUMENT_AI_ENDPOINT;
    }

    /**
     * Process document image using available OCR service
     * Tries Document AI first, falls back to Vision API, then mock
     */
    async processDocument(imageBuffer: Buffer): Promise<DocumentAIResult> {
        const startTime = Date.now();

        // Try Vision API if available (most likely to be configured)
        if (this.visionApiKey) {
            console.log('[DocumentAI] Using Google Vision API');
            return this.processWithVisionAPI(imageBuffer, startTime);
        }

        // Fall back to mock for development
        console.warn('[DocumentAI] No API configured, using mock response');
        return this.getMockResponse(startTime);
    }

    /**
     * Process with Google Cloud Vision API
     * Returns word-level bounding boxes and confidence
     */
    private async processWithVisionAPI(
        imageBuffer: Buffer,
        startTime: number
    ): Promise<DocumentAIResult> {
        try {
            const base64Image = imageBuffer.toString('base64');

            const response = await fetch(
                `https://vision.googleapis.com/v1/images:annotate?key=${this.visionApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requests: [
                            {
                                image: { content: base64Image },
                                features: [
                                    { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 100 },
                                ],
                            },
                        ],
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[DocumentAI] Vision API error:', errorData);
                return {
                    success: false,
                    error: 'API_ERROR',
                    message: errorData.error?.message || 'Failed to process image',
                    processorType: 'vision_api',
                };
            }

            const data = await response.json();
            const fullTextAnnotation = data.responses?.[0]?.fullTextAnnotation;
            const textAnnotations = data.responses?.[0]?.textAnnotations;

            if (!fullTextAnnotation && (!textAnnotations || textAnnotations.length === 0)) {
                return {
                    success: false,
                    error: 'NO_TEXT_DETECTED',
                    message: 'No text found in the image',
                    processorType: 'vision_api',
                };
            }

            // Extract words with bounding boxes
            const words: OCRWord[] = [];
            const blocks: OCRBlock[] = [];

            // Use fullTextAnnotation for better structure if available
            if (fullTextAnnotation?.pages?.[0]) {
                const page = fullTextAnnotation.pages[0];
                const pageWidth = page.width || 1000;
                const pageHeight = page.height || 1000;

                for (const block of page.blocks || []) {
                    const blockWords: OCRWord[] = [];
                    let blockText = '';

                    for (const paragraph of block.paragraphs || []) {
                        for (const word of paragraph.words || []) {
                            const wordText = word.symbols?.map((s: { text: string }) => s.text).join('') || '';
                            const wordConfidence = word.confidence || 0.5;

                            const vertices = word.boundingBox?.vertices || [];
                            const minX = Math.min(...vertices.map((v: { x?: number }) => v.x || 0));
                            const minY = Math.min(...vertices.map((v: { y?: number }) => v.y || 0));
                            const maxX = Math.max(...vertices.map((v: { x?: number }) => v.x || 0));
                            const maxY = Math.max(...vertices.map((v: { y?: number }) => v.y || 0));

                            const ocrWord: OCRWord = {
                                text: wordText,
                                confidence: wordConfidence,
                                boundingBox: {
                                    x: minX,
                                    y: minY,
                                    width: maxX - minX,
                                    height: maxY - minY,
                                },
                            };

                            words.push(ocrWord);
                            blockWords.push(ocrWord);
                            blockText += wordText + ' ';
                        }
                    }

                    if (blockWords.length > 0) {
                        const blockVertices = block.boundingBox?.vertices || [];
                        const minX = Math.min(...blockVertices.map((v: { x?: number }) => v.x || 0));
                        const minY = Math.min(...blockVertices.map((v: { y?: number }) => v.y || 0));
                        const maxX = Math.max(...blockVertices.map((v: { x?: number }) => v.x || 0));
                        const maxY = Math.max(...blockVertices.map((v: { y?: number }) => v.y || 0));

                        blocks.push({
                            text: blockText.trim(),
                            confidence: block.confidence || 0.5,
                            words: blockWords,
                            boundingBox: {
                                x: minX,
                                y: minY,
                                width: maxX - minX,
                                height: maxY - minY,
                            },
                        });
                    }
                }

                return {
                    success: true,
                    fullText: fullTextAnnotation.text || '',
                    words,
                    blocks,
                    processingTime: Date.now() - startTime,
                    pageWidth,
                    pageHeight,
                    rawResponse: data.responses?.[0],
                    processorType: 'vision_api',
                };
            }

            // Fallback to textAnnotations if fullTextAnnotation not available
            if (textAnnotations && textAnnotations.length > 0) {
                const fullText = textAnnotations[0].description;

                const extractedWords: OCRWord[] = textAnnotations.slice(1).map((annotation: GoogleVisionAnnotation) => {
                    const vertices = annotation.boundingPoly?.vertices || [];
                    const minX = Math.min(...vertices.map(v => v.x || 0));
                    const minY = Math.min(...vertices.map(v => v.y || 0));
                    const maxX = Math.max(...vertices.map(v => v.x || 0));
                    const maxY = Math.max(...vertices.map(v => v.y || 0));

                    return {
                        text: annotation.description,
                        confidence: 0.8, // Default confidence when not provided
                        boundingBox: {
                            x: minX,
                            y: minY,
                            width: maxX - minX,
                            height: maxY - minY,
                        },
                    };
                });

                return {
                    success: true,
                    fullText,
                    words: extractedWords,
                    blocks: [],
                    processingTime: Date.now() - startTime,
                    rawResponse: data.responses?.[0],
                    processorType: 'vision_api',
                };
            }

            return {
                success: false,
                error: 'PARSE_ERROR',
                message: 'Failed to parse OCR response',
                processorType: 'vision_api',
            };
        } catch (error) {
            console.error('[DocumentAI] Vision API error:', error);
            return {
                success: false,
                error: 'PROCESSING_ERROR',
                message: error instanceof Error ? error.message : 'OCR processing failed',
                processorType: 'vision_api',
            };
        }
    }

    /**
     * Mock response for development/testing
     * Simulates a handwritten gym register
     */
    private getMockResponse(startTime: number): DocumentAIResult {
        const mockText = `GYM REGISTER - JANUARY 2026

Sr.  Name                Phone          Date       Amount   Status
-------------------------------------------------------------------
1    Rajesh Kumar        9876543210     15/01/26   1500     Paid
2    Priya Sharma        8765432109     15/01/26   2000     Paid
3    Amit Singh          7654321098     16/01/26   1500     Unpaid
4    Sunita Devi         9988776655     17/01/26   3000     Paid
5    Vikram Patel        8877665544     18/01/26   1500     Partial`;

        // Generate mock words with bounding boxes
        const lines = mockText.split('\n');
        const words: OCRWord[] = [];
        let yOffset = 50;

        for (const line of lines) {
            const lineWords = line.split(/\s+/).filter(w => w.length > 0);
            let xOffset = 50;

            for (const word of lineWords) {
                words.push({
                    text: word,
                    confidence: 0.7 + Math.random() * 0.25, // Random confidence 0.7-0.95
                    boundingBox: {
                        x: xOffset,
                        y: yOffset,
                        width: word.length * 12,
                        height: 20,
                    },
                });
                xOffset += word.length * 12 + 15;
            }
            yOffset += 35;
        }

        return {
            success: true,
            fullText: mockText,
            words,
            blocks: [],
            processingTime: Date.now() - startTime,
            pageWidth: 800,
            pageHeight: yOffset + 50,
            processorType: 'mock',
        };
    }
}

// Export singleton instance
export const documentAIService = new DocumentAIService();
