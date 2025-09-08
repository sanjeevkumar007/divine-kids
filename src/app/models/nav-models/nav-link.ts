export interface NavLink {
    label: string;
    url?: string;
    id: number;
    children?: NavLink[];
    products?: { name: string; url?: string, id: number }[]; // <-- Add this line
}