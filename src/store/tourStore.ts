import { create } from 'zustand';

export interface TourStep {
  route: string;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    route: '/pos',
    title: 'Point of Sale',
    description:
      'Tap any product to add it to the cart. Use search and category tabs to find items. Adjust quantities and apply discounts before taking payment.',
  },
  {
    route: '/inventory',
    title: 'Inventory — Product List',
    description:
      'Browse all products. Use search and category filters. Tap any product to edit it. Tap the + button to add a new product.',
  },
  {
    route: '/inventory',
    title: 'Recipe Stocks',
    description:
      'Tap "Recipe Stocks" to see all ingredients. Each has a fixed batch size. Tap "+Add Stock" to restock. Swipe left to delete an ingredient.',
  },
  {
    route: '/inventory',
    title: 'Product Recipes',
    description:
      'Tap any Coffee/Tea/Frapp/Drink product and scroll to "Recipe Ingredients" to add ingredients and set quantities per serving. Selling deducts from ingredients.',
  },
  {
    route: '/settings',
    title: 'Settings',
    description:
      'Edit store name, currency, branding. Toggle dark mode. Upload brand logo. Set up GCash/Maya QR payments. Export/import inventory as Excel.',
  },
];

interface TourState {
  active: boolean;
  step: number;
  steps: TourStep[];
  start: () => void;
  next: () => void;
  prev: () => void;
  end: () => void;
}

export const useTourStore = create<TourState>((set, get) => ({
  active: false,
  step: 0,
  steps: TOUR_STEPS,
  start: () => set({ active: true, step: 0 }),
  next: () => {
    const { step, steps, active } = get();
    if (step < steps.length - 1) {
      set({ step: step + 1 });
    } else if (active) {
      set({ active: false, step: 0 });
    }
  },
  prev: () => {
    const { step } = get();
    if (step > 0) set({ step: step - 1 });
  },
  end: () => set({ active: false, step: 0 }),
}));
