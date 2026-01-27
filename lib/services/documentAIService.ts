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
     * No mock response - return error if API key not configured
     * This prevents fake data from being shown to users
     */
    private getMockResponse(startTime: number): DocumentAIResult {
        console.error('[DocumentAI] No API key configured - cannot process');
        return {
            success: false,
            error: 'NO_API_KEY',
            message: 'No OCR API configured. Please configure Gemini or Vision API key.',
            processingTime: Date.now() - startTime,
            processorType: 'mock',
        };
    }
}

// Export singleton instance
export const documentAIService = new DocumentAIService();
