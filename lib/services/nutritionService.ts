/**
 * Nutrition Lookup Service
 * Uses Google Gemini AI to look up nutrition data for food items.
 * Returns calories, protein, carbs, fat, and serving size.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface NutritionData {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    serving: string;
}

export interface NutritionLookupResult {
    success: boolean;
    data?: NutritionData;
    error?: string;
}

class NutritionService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        }
    }

    isAvailable(): boolean {
        return this.model !== null;
    }

    async lookup(foodName: string): Promise<NutritionLookupResult> {
        if (!this.model) {
            return { success: false, error: 'Gemini API key not configured' };
        }

        if (!foodName.trim()) {
            return { success: false, error: 'Food name is required' };
        }

        try {
            const prompt = `You are a nutrition database. Given a food item, respond ONLY with a valid JSON object — no markdown, no explanation, no extra text.

The JSON must have exactly these fields:
{
  "calories": <number>,
  "protein_g": <number>,
  "carbs_g": <number>,
  "fat_g": <number>,
  "fiber_g": <number>,
  "serving": "<string describing the serving size these values are for>"
}

Rules:
- Use standard serving sizes (e.g. 1 medium chapati ~40g, 1 cup cooked rice ~180g, 100g for ambiguous items)
- If a quantity is specified (like "2 chapatis"), multiply the values accordingly
- All values should be realistic and accurate to the best nutritional knowledge available
- Round numbers to 1 decimal place
- For Indian foods, use values appropriate to typical Indian preparation methods

Food item: ${foodName}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Strip any accidental markdown fences
            const clean = text.replace(/```json|```/gi, '').trim();
            const jsonMatch = clean.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                return { success: false, error: 'Could not parse nutrition data' };
            }

            const nutrition: NutritionData = JSON.parse(jsonMatch[0]);

            // Validate the response has required fields
            if (
                typeof nutrition.calories !== 'number' ||
                typeof nutrition.protein_g !== 'number' ||
                typeof nutrition.carbs_g !== 'number' ||
                typeof nutrition.fat_g !== 'number'
            ) {
                return { success: false, error: 'Invalid nutrition data received' };
            }

            return {
                success: true,
                data: {
                    calories: Math.round(nutrition.calories * 10) / 10,
                    protein_g: Math.round(nutrition.protein_g * 10) / 10,
                    carbs_g: Math.round(nutrition.carbs_g * 10) / 10,
                    fat_g: Math.round(nutrition.fat_g * 10) / 10,
                    fiber_g: Math.round((nutrition.fiber_g || 0) * 10) / 10,
                    serving: nutrition.serving || foodName,
                },
            };
        } catch (error) {
            console.error('[NutritionService] Lookup error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to look up nutrition data',
            };
        }
    }
}

export const nutritionService = new NutritionService();
