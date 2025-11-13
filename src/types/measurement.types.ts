export interface Measurement {
  id?: string;
  date: string;
  weight: number;
  waist: number;
  bodyFat?: number;
  photos?: string[];
}