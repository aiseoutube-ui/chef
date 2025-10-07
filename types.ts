

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  estimatedLocalPrice: number;
}

export interface Recipe {
  dishName: string;
  ingredients: Ingredient[];
  instructions: string[];
  currencyCode: string;
  supermarketSuggestions: string[];
  preparationTime?: string;
  difficulty?: string;
  calories?: number;
}

export interface UserStatus {
  freeCount: number;
  adCount: number;
  lastAnalysisTimestamp: number;
  isBonusActive: boolean;
  freeLimit: number;
  adBonusLimit: number;
}

export interface LocationCoords {
  lat: number;
  lon: number;
}

export enum ApiAction {
    GET_STATUS = 'get_status',
    ANALYZE = 'analyze',
    CLAIM_AD_BONUS = 'claim_ad_bonus'
}