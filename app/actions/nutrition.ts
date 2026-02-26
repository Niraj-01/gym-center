'use server';

import { nutritionService, NutritionLookupResult } from '@/lib/services/nutritionService';

/**
 * Server action to look up nutrition data for a food item using Gemini AI.
 * Keeps API keys server-side and avoids CORS issues.
 */
export async function lookupNutrition(foodName: string): Promise<NutritionLookupResult> {
    if (!foodName || !foodName.trim()) {
        return { success: false, error: 'Please enter a food name' };
    }

    if (!nutritionService.isAvailable()) {
        return { success: false, error: 'Nutrition lookup service is not configured' };
    }

    return nutritionService.lookup(foodName.trim());
}
