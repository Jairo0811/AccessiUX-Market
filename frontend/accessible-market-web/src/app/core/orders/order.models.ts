export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  itemCount: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  canCancel: boolean;
  canComplete: boolean;
  invoiceAvailable: boolean;
  cancelUntilUtc: string;
  cancellationMessage: string;
  completedAtUtc: string | null;
}

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderAddress {
  recipientName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  phone: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  address: OrderAddress;
  items: OrderItem[];
  createdAtUtc: string;
  updatedAtUtc: string;
  cancelledAtUtc: string | null;
  completedAtUtc: string | null;
  canCancel: boolean;
  canComplete: boolean;
  invoiceAvailable: boolean;
  cancelUntilUtc: string;
  cancellationMessage: string;
}

export interface OrderCancellation {
  id: string;
  orderNumber: string;
  status: string;
  cancelledAtUtc: string;
  message: string;
}

export interface OrderCompletion {
  id: string;
  orderNumber: string;
  status: string;
  completedAtUtc: string;
  message: string;
}

export interface OrderInvoice {
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  status: string;
  issuedAtUtc: string;
  currency: string;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  address: OrderAddress;
  items: OrderItem[];
}
