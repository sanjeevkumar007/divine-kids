export interface Product {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    categoryId: number;
    description: string;
    requiresShipping: boolean;
    weightKg?: number;
    color?: string;
    lengthCm?: number; // 0-5
    widthCm?: number;
    heightCm?: number;
    badges: string[];
    rating: number;
    reviews: number;
    inStock: boolean;
    specs: { [key: string]: string };
}
