export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  category: string;
  rating?: number;
  ratingCount?: number;
  badges?: ReadonlyArray<string>;
}
