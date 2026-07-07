export enum EventName {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  RAW_MATERIAL_LOW = 'RAW_MATERIAL_LOW',
}

export interface OrderCreatedPayload {
  id: string;
  tableId: string;
  comboId: string;
  quantity: number;
  notes?: string;
  status: string;
}

export interface OrderCompletedPayload {
  orderId: string;
}

export interface PaymentCompletedPayload {
  billId: string;
  tableId: string;
  amount: number;
}

export interface RawMaterialLowPayload {
  ingredientName: string;
  currentQuantity: number;
  threshold: number;
}
