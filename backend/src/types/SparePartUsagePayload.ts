export interface ApplyPartPayload {
  ticketId: number;
  partCode: string;
  quantity: number;
}

export interface DecidePartPayload {
  usageId: number;
  reason?: string;
}

export interface AdjustStockPayload {
  partCode: string;
  newStock: number;
}
