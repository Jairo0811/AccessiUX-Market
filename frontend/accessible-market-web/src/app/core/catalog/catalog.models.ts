export interface Category { id: string; name: string; slug: string; description: string | null; }
export interface Seller { id: string; displayName: string; slug: string; description: string | null; }
export interface Product { id: string; sellerId: string; categoryId: string; name: string; slug: string; description: string; price: number; currency: string; stockQuantity: number; status: string; }
export interface CreateSellerRequest { displayName: string; slug: string; description?: string | null; }
export interface CreateProductRequest { categoryId: string; name: string; slug: string; description: string; price: number; currency: string; stockQuantity: number; }
