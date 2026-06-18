import { create } from 'zustand';
import type { RecipeItemWithName } from '../types/database';
import { getDatabase } from '../database/connection';
import * as recipesRepo from '../database/recipes';

interface RecipeState {
  recipes: Record<number, RecipeItemWithName[]>;
  fetchRecipe: (productId: number) => Promise<void>;
  addIngredient: (productId: number, ingredientId: number, quantity: number, measurement?: string) => Promise<void>;
  removeIngredient: (productId: number, ingredientId: number) => Promise<void>;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  recipes: {},
  fetchRecipe: async (productId: number) => {
    try {
      const db = await getDatabase();
      const items = await recipesRepo.getRecipe(db, productId);
      set(s => ({ recipes: { ...s.recipes, [productId]: items } }));
    } catch {}
  },
  addIngredient: async (productId: number, ingredientId: number, quantity: number, measurement?: string) => {
    try {
      const db = await getDatabase();
      await recipesRepo.addRecipeItem(db, productId, ingredientId, quantity, measurement);
      const items = await recipesRepo.getRecipe(db, productId);
      set(s => ({ recipes: { ...s.recipes, [productId]: items } }));
    } catch {}
  },
  removeIngredient: async (productId: number, ingredientId: number) => {
    try {
      const db = await getDatabase();
      await recipesRepo.removeRecipeItem(db, productId, ingredientId);
      const items = await recipesRepo.getRecipe(db, productId);
      set(s => ({ recipes: { ...s.recipes, [productId]: items } }));
    } catch {}
  },
}));
