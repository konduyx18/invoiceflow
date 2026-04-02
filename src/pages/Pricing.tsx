import React from 'react';
import { motion } from 'motion/react';
import { Check, X, Star, Zap, Shield, HelpCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PlanCard = ({ 
  title, 
  price, 
  description, 
  features, 
  notIncluded = [], 
  isPopular = false, 
  buttonText, 
  onButtonClick,
  isFree = false
}: { 
  title: string; 
  price: string; 
  description: string; 
  features: string[]; 
  notIncluded?: string[]; 
  isPopular?: boolean; 
  buttonText: string; 
  onButtonClick: () => void;
  isFree?: boolean;
}) => (
  <motion.div 
    whileHover={{ y: -8 }}
    className={cn(
      "relative bg-white rounded-[40px] p-10 border-2 transition-all duration-300 flex flex-col h-full",
      isPopular ? "border-blue-600 shadow-2xl shadow-blue-100" : "border-gray-100 shadow-xl shadow-gray-50"
    )}
  >
    {isPopular && (
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
        <Star size={16} fill="white" />
        Most Popular
      </div>
    )}

    <div className="mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>

    <div className="mb-10">
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-black text-gray-900">{price}</span>
        <span className="text-gray-500 font-medium">/month</span>
      </div>
    </div>

    <div className="space-y-5 mb-12 flex-1">
      {features.map((feature, i) => (
        <div key={i} className="flex items-center gap-4 group">
          <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Check size={14} />
          </div>
          <span className="text-gray-700 font-medium">{feature}</span>
        </div>
      ))}
      {notIncluded.map((feature, i) => (
        <div key={i} className="flex items-center gap-4 opacity-40">
          <div className="w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
            <X size={14} />
          </div>
          <span className="text-gray-500 font-medium line-through">{feature}</span>
        </div>
      ))}
    </div>

    <button 
      onClick={onButtonClick}
      className={cn(
        "w-full py-5 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-2 group",
        isPopular 
          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100" 
          : "bg-gray-900 text-white hover:bg-gray-800"
      )}
    >
      {buttonText}
      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
    </button>
  </motion.div>
);

import { cn } from '../lib/utils';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleProUpgrade = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('Failed to start checkout. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-blue-50/50" />
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-bold text-sm mb-8"
          >
            <Zap size={16} fill="currentColor" />
            Pricing Plans
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tight"
          >
            Simple, transparent <br />
            <span className="text-blue-600">pricing for everyone.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto mb-16 leading-relaxed"
          >
            Choose the plan that's right for your business. <br />
            Upgrade to Pro for AI-powered features and unlimited growth.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <PlanCard 
              title="Free Plan"
              price="$0"
              description="Perfect for freelancers just starting out."
              features={[
                "5 invoices per month",
                "1 basic invoice template",
                "Basic PDF generation",
                "Max 10 clients",
                "Basic dashboard stats"
              ]}
              notIncluded={[
                "AI Chatbot assistant",
                "AI Receipt scanner",
                "Voice invoice creation",
                "Recurring invoices",
                "Unlimited everything"
              ]}
              buttonText={user ? "Current Plan" : "Get Started"}
              onButtonClick={() => !user && navigate('/login')}
              isFree={true}
            />
            
            <PlanCard 
              title="Pro Plan"
              price="$15"
              description="Everything you need to scale your business."
              isPopular={true}
              features={[
                "Unlimited invoices & clients",
                "All invoice templates",
                "AI Chatbot assistant",
                "AI Receipt scanner",
                "Voice invoice creation",
                "Recurring invoices",
                "Professional PDF with logo",
                "Priority support"
              ]}
              buttonText={profile?.subscriptionPlan === 'PRO' ? "Manage Subscription" : "Start Pro - $15/month"}
              onButtonClick={handleProUpgrade}
            />
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-500">Everything you need to know about our plans.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time from your settings page. You'll keep access until the end of your billing period." },
              { q: "Is there a free trial?", a: "Absolutely! Every Pro subscription starts with a 7-day free trial. You won't be charged until the trial ends." },
              { q: "What payment methods?", a: "We accept all major credit cards, including Visa, Mastercard, and American Express, processed securely via Stripe." },
              { q: "Can I upgrade later?", a: "Yes, you can upgrade from Free to Pro at any time. Your new features will be available immediately." }
            ].map((faq, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-blue-600">
                  <HelpCircle size={20} />
                  <h4 className="font-bold text-gray-900">{faq.q}</h4>
                </div>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from)_0%,_transparent_50%)] from-white/10" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8">Ready to supercharge your billing?</h2>
          <button 
            onClick={handleProUpgrade}
            className="px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-xl hover:bg-blue-50 transition-all shadow-2xl shadow-black/10"
          >
            Start Your Free Trial
          </button>
        </div>
      </div>
    </div>
  );
};
