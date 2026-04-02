import { useAuth } from './useAuth';

export const useSubscription = () => {
  const { profile } = useAuth();

  const plan = profile?.subscriptionPlan || 'FREE';
  const isPro = plan === 'PRO';
  const isFree = plan === 'FREE';
  const invoiceCount = profile?.invoiceCount || 0;
  const invoiceLimit = 5;

  return {
    plan,
    isPro,
    isFree,
    invoiceCount,
    invoiceLimit,
    canCreateInvoice: isPro || invoiceCount < invoiceLimit,
    remainingInvoices: Math.max(0, invoiceLimit - invoiceCount),
  };
};
