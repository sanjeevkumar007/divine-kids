import { Category } from "./category";


export interface MainCategory {
    id: number;
    name: string;
    description?: string;
    imageUrl?: string;
    categories: Category[];
}


