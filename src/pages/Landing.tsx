import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle, 
  Shield, 
  Zap, 
  ArrowRight,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <FileText className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">InvoiceFlow</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link to="/dashboard" className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 font-medium hover:text-gray-900">Login</Link>
              <Link to="/login" className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors">
                Start Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-6">
            Simple Invoicing for US Freelancers
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 tracking-tight leading-tight">
            Get paid faster with <br />
            <span className="text-blue-600">professional invoices.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create, send, and track invoices in seconds. Built specifically for freelancers and small businesses in the US.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              Start Free Now <ArrowRight size={20} />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-all">
              View Demo
            </button>
          </div>
        </motion.div>

        {/* Hero Image / Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 relative"
        >
          <div className="bg-gray-100 rounded-3xl p-4 shadow-2xl border border-gray-200">
            <img 
              src="https://picsum.photos/seed/invoice/1200/800" 
              alt="Dashboard Preview" 
              className="rounded-2xl w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-10 -right-10 hidden lg:block">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Invoice Paid</p>
                <p className="text-xl font-bold text-gray-900">$2,450.00</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need to manage billing</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Focus on your work, let InvoiceFlow handle the paperwork.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Zap} 
              title="Fast Creation" 
              description="Create professional invoices in under 60 seconds with our intuitive editor."
            />
            <FeatureCard 
              icon={Shield} 
              title="Secure Payments" 
              description="Integrated with Stripe to ensure your payments are handled securely and quickly."
            />
            <FeatureCard 
              icon={FileText} 
              title="PDF Generation" 
              description="Download and send beautiful PDF invoices that reflect your brand identity."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-600">Choose the plan that's right for your business.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-10 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle size={18} className="text-green-500" />
                  Up to 5 invoices per month
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle size={18} className="text-green-500" />
                  Basic PDF generation
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle size={18} className="text-green-500" />
                  Client management
                </li>
              </ul>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-10 bg-blue-600 rounded-3xl shadow-xl shadow-blue-200 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Recommended</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">$9</span>
                <span className="text-blue-100">/month</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle size={18} className="text-blue-200" />
                  Unlimited invoices
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle size={18} className="text-blue-200" />
                  Custom logo on PDF
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle size={18} className="text-blue-200" />
                  Priority email support
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle size={18} className="text-blue-200" />
                  Advanced analytics
                </li>
              </ul>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="text-white" size={18} />
                </div>
                <span className="text-xl font-bold">InvoiceFlow</span>
              </div>
              <p className="text-gray-400 max-w-sm mb-6">
                The most intuitive invoicing platform for US-based freelancers and small business owners.
              </p>
              <div className="flex gap-4">
                <Twitter className="text-gray-400 hover:text-white cursor-pointer" size={20} />
                <Github className="text-gray-400 hover:text-white cursor-pointer" size={20} />
                <Linkedin className="text-gray-400 hover:text-white cursor-pointer" size={20} />
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="hover:text-white cursor-pointer">Features</li>
                <li className="hover:text-white cursor-pointer">Pricing</li>
                <li className="hover:text-white cursor-pointer">Demo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="hover:text-white cursor-pointer">About</li>
                <li className="hover:text-white cursor-pointer">Privacy</li>
                <li className="hover:text-white cursor-pointer">Terms</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            © 2026 InvoiceFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
