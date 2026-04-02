import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, featureName, featureDescription }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <X size={20} />
          </button>

          <div className="p-8 md:p-10">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles size={32} />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Unlock {featureName}
            </h2>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              {featureDescription}
            </p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-amber-500 fill-amber-500" />
                  <span className="font-bold text-gray-900">Pro Plan</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">$15</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3">
                {[
                  'Unlimited invoices & clients',
                  'AI-powered receipt scanning',
                  'Voice invoice creation',
                  'Automated recurring invoices',
                  'Professional PDF templates'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={12} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  onClose();
                  navigate('/pricing');
                }}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
              >
                Start 7-Day Free Trial
              </button>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-white text-gray-500 font-bold hover:text-gray-900 transition-all"
              >
                Maybe Later
              </button>
            </div>
          </div>
          
          <div className="bg-blue-600 py-3 text-center">
            <p className="text-white text-xs font-bold uppercase tracking-wider">
              Cancel anytime • 100% Money-back guarantee
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
