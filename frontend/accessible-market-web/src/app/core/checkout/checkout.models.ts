export interface CheckoutAddressRequest {
  recipientName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  phone: string;
}

export interface CheckoutRequest {
  address: CheckoutAddressRequest;
  paymentMethod: 'Card' | 'CashOnDelivery';
}

export interface CheckoutItem {
  productId: string;
  name: string;
  slug: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  lineTotal: number;
}

export interface CheckoutReview {
  items: CheckoutItem[];
  address: CheckoutAddressRequest;
  paymentMethod: string;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  currency: string;
  canConfirm: boolean;
  warnings: string[];
}

export interface CheckoutConfirmation {
  orderId: string;
  orderNumber: string;
  total: number;
  currency: string;
  status: string;
  createdAtUtc: string;
}
