import { CurrencyCode } from "../models/Payments";

// Interfaces
export interface CustomerMetadata {
    [key: string]: string | number | boolean | null;
}

export interface CreateCustomerData {
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    metadata?: CustomerMetadata;
}

export interface PaystackCustomer {
    id: number;
    integration: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    metadata: CustomerMetadata | null;
    domain: string;
    customer_code: string;
    identified: boolean;
    identifications: any[] | null;
    createdAt: string;
    updatedAt: string;
}

export interface PaystackResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

export interface PaystackErrorResponse {
    status: boolean;
    message: string;
}

export interface CreateCustomerResult {
    success: boolean;
    data?: PaystackResponse<PaystackCustomer>;
    error?: any;
    status?: number;
}

export interface BankAccountValidationData {
    type: string; // e.g., "bvn", "bank_account"
    country: string; // e.g., "NG" - two-letter country code
    bvn?: string; // Bank Verification Number
    bank_code: string; // e.g., "097"
    account_number: string; // e.g., "911111111"
    first_name?: string; // Customer's first name
    last_name?: string; // Customer's last name
}

export interface ValidationResponse {
    status: boolean;
    message: string;
    data: {
        verified: boolean;
        verification_message: string;
        account_name?: string;
        bank_name?: string;
        details?: any;
    };
}

export interface PaystackErrorResponse {
    status: boolean;
    message: string;
}
export interface CustomerIdentificationResponse {
    status: boolean;
    message: string;
    data?: {
        identification_id?: string;
        customer_code?: string;
        status?: string;
        verification_status?: string;
        requested_at?: string;
        completed_at?: string;
    };
}


export interface PaystackInitializeResponse {
    status: boolean;
    message: string;
    data: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  }
  
  export interface PaystackTransaction {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned' | 'reversed';
    reference: string;
    receipt_number: string | null;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: CurrencyCode;
    ip_address: string;
    metadata: {
      userId: string;
      orderId: string;
      referrer: string;
    };
    log: {
      start_time: number;
      time_spent: number;
      attempts: number;
      errors: number;
      success: boolean;
      mobile: boolean;
      input: any[];
      history: any[];
    };
    fees: number;
    fees_split: any;
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string | null;
      account_name: string | null;
      receiver_bank_account_number: string | null;
      receiver_bank: string | null;
    };
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: any;
      risk_action: string;
      international_format_phone: string | null;
    };
    plan: any;
    split: Record<string, any>;
    order_id: string | null;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
    connect: any;
    transaction_date: string;
    plan_object: Record<string, any>;
    subaccount: Record<string, any>;
  }
  
export interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: PaystackTransaction;
  }
  
export interface PaystackRefundResponse {
    status: boolean;
    message: string;
    data: {
      transaction: PaystackTransaction;
      refund: {
        id: number;
        amount: number;
        status: 'processed' | 'pending' | 'failed';
      };
    };
  }
  
export interface PaystackWebhookEvent {
    event: string;
    data: {
      reference: string;
      status: 'success' | 'failed';
      amount: number;
      currency: CurrencyCode;
      metadata: Record<string, any>;
      id: number;
      authorization?: {
        authorization_code: string;
        card_type: string;
        last4: string;
        brand: string;
      };
    };
  }