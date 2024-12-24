export interface SodaEntry {
  id: string;
  userId: string;
  date: string;
  amount: number;
  brand: string;
  calories: number;
  sugar: number;
  carbs: number;
  caffeine: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserGoals {
  id: string;
  userId: string;
  dailyLimit: number;
  weeklyLimit: number;
  targetReduction: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface SuccessResponse<T> {
  data: T;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface GetEntriesQuery {
  startDate: string;
  endDate: string;
}

export interface CreateEntryBody {
  date: string;
  amount: number;
  brand: string;
  calories: number;
  sugar: number;
  carbs: number;
  caffeine: number;
}

export interface UpdateGoalsBody {
  dailyLimit: number;
  weeklyLimit: number;
  targetReduction: number;
}

export interface UpdateProfileBody {
  displayName?: string;
}