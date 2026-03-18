export interface ProdigiOrder {
  id: string;
  created: string;
  lastUpdated: string;
  callbackUrl: string | null;
  merchantReference: string;
  shippingMethod: string;
  idempotencyKey: string | null;
  status: ProdigiOrderStatus;
  charges: ProdigiCharge[];
  shipments: ProdigiShipment[];
  recipient: ProdigiRecipient;
  items: ProdigiItem[];
  packingSlip: string | null;
  metadata: Record<string, unknown>;
}

export type ProdigiStatusStage =
  | 'Draft'
  | 'AwaitingPayment'
  | 'InProgress'
  | 'Complete'
  | 'Cancelled';

export type ProdigiDetailStatus = 'NotStarted' | 'InProgress' | 'Complete' | 'Error';

export interface ProdigiOrderStatus {
  stage: ProdigiStatusStage;
  issues: ProdigiIssue[];
  details: {
    downloadAssets: ProdigiDetailStatus;
    printReadyAssetsPrepared: ProdigiDetailStatus;
    allocateProductionLocation: ProdigiDetailStatus;
    inProduction: ProdigiDetailStatus;
    shipping: ProdigiDetailStatus;
  };
}

export interface ProdigiIssue {
  objectId: string;
  errorCode: string;
  description: string;
  authorizationDetails?: {
    authorisationUrl: string;
    paymentDetails: {
      amount: string;
      currency: string;
    };
  };
}

export interface ProdigiCharge {
  id: string;
  prodigiInvoiceNumber: string | null;
  totalCost: ProdigiCost;
  totalTax: ProdigiCost;
  items: ProdigiChargeItem[];
}

export interface ProdigiChargeItem {
  id: string;
  itemId: string;
  cost: ProdigiCost;
  shipmentId: string | null;
}

export interface ProdigiCost {
  amount: string;
  currency: string;
}

export interface ProdigiShipment {
  id: string;
  dispatchDate: string;
  carrier: { name: string; service: string };
  tracking: { number: string; url: string } | null;
  items: { itemId: string }[];
}

export interface ProdigiRecipient {
  name: string;
  email: string | null;
  phoneNumber: string | null;
  address: {
    line1: string;
    line2: string | null;
    postalOrZipCode: string;
    countryCode: string;
    townOrCity: string;
    stateOrCounty: string | null;
  };
}

export interface ProdigiAsset {
  id: string;
  printArea: string;
  md5Hash: string;
  url: string;
  status: string;
}

export interface ProdigiItem {
  id: string;
  status: string;
  merchantReference: string;
  sku: string;
  copies: number;
  sizing: string;
  attributes: Record<string, string>;
  assets: ProdigiAsset[];
  recipientCost: ProdigiCost | null;
}

export interface ProdigiOrderResponse {
  order: ProdigiOrder;
}

export interface ProdigiWebhookPayload {
  event: string;
  order: ProdigiOrder;
}
