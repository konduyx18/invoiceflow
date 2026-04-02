export type SubscriptionPlan = 'FREE' | 'PRO';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  companyName?: string;
  companyLogo?: string;
  companyAddress?: string;
  phone?: string;
  subscriptionPlan: SubscriptionPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  invoiceCount: number;
  invoiceCountResetDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  paymentTerms?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  isRecurring?: boolean;
  recurringId?: string;
}

export type RecurringFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringInvoice {
  id: string;
  userId: string;
  clientId: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  lastGeneratedDate?: string;
  nextGenerationDate: string;
  isActive: boolean;
  template: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'issueDate' | 'dueDate' | 'createdAt' | 'updatedAt' | 'paidAt' | 'isRecurring' | 'recurringId'>;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  items: InvoiceItem[];
  taxRate: number;
  discountPercent: number;
  currency: string;
  notes?: string;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}
