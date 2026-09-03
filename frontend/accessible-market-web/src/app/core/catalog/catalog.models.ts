export interface Category { id: string; name: string; slug: string; description: string | null; }
export interface Seller { id: string; displayName: string; slug: string; description: string | null; }
export interface Product { id: string; sellerId: string; categoryId: string; name: string; slug: string; description: string; price: number; currency: string; stockQuantity: number; status: string; }
export interface CreateSellerRequest { displayName: string; slug: string; description?: string | null; }
export interface CreateProductRequest { categoryId: string; name: string; slug: string; description: string; price: number; currency: string; stockQuantity: number; }
export interface CatalogSearchParams { q?: string; categoryId?: string; minPrice?: number; maxPrice?: number; inStock?: boolean; sort?: string; page?: number; pageSize?: number; }
export interface CategoryFacet { id: string; name: string; slug: string; count: number; }
export interface CatalogFacets { categories: CategoryFacet[]; minPrice: number | null; maxPrice: number | null; }
export interface CatalogSearchResult { items: Product[]; totalCount: number; page: number; pageSize: number; totalPages: number; facets: CatalogFacets; }
