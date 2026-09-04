export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  availableStock: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  currency: string;
}

export interface AddCartItemRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
