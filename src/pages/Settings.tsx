import React, { useState } from 'react';
import { 
  User, 
  Building, 
  CreditCard, 
  Bell, 
  Shield, 
  Save,
  Upload,
  Check,
  Plus,
  Loader2,
  XCircle,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { userService } from '../services/userService';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { profile } = useAuth();
  const { isPro, isFree } = useSubscription();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    companyName: profile?.companyName || '',
    companyAddress: profile?.companyAddress || '',
    phone: profile?.phone || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;

    setIsSaving(true);
    try {
      await userService.updateUserProfile(profile.uid, formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!profile?.uid) return;
    
    setIsPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: profile.uid }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Failed to create portal session');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setIsPortalLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account preferences and company details.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === tab.id 
                  ? "bg-blue-50 text-blue-600 font-bold" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="p-8 space-y-8">
              <div className="flex items-center gap-6 pb-8 border-b border-gray-100">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold">
                    {formData.name?.charAt(0) || 'U'}
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-2 bg-white border border-gray-200 rounded-xl shadow-lg text-gray-500 hover:text-blue-600 transition-all">
                    <Upload size={16} />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Profile Picture</h3>
                  <p className="text-sm text-gray-500">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Email Address</label>
                  <input 
                    type="email" 
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                    value={formData.email}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Phone Number</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <div className={cn(
                  "flex items-center gap-2 text-green-600 font-bold text-sm transition-opacity duration-500",
                  showSuccess ? "opacity-100" : "opacity-0"
                )}>
                  <Check size={18} /> Settings saved successfully
                </div>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={20} /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'company' && (
            <form onSubmit={handleSave} className="p-8 space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Company Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Company Address</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px]"
                    value={formData.companyAddress}
                    onChange={(e) => setFormData({...formData, companyAddress: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-100">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={20} /> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'billing' && (
            <div className="p-8 space-y-8">
              <div className={cn(
                "p-6 rounded-2xl text-white relative overflow-hidden",
                isPro ? "bg-gradient-to-br from-blue-600 to-indigo-700" : "bg-gray-800"
              )}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-blue-100 text-sm font-medium">Current Plan</p>
                    {isPro && (
                      <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-bold mb-6">{profile?.subscriptionPlan || 'FREE'} Plan</h3>
                  <div className="flex items-center gap-4">
                    {isFree ? (
                      <button 
                        onClick={() => navigate('/pricing')}
                        className="px-6 py-2.5 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all"
                      >
                        Upgrade to Pro
                      </button>
                    ) : (
                      <button 
                        onClick={handleManageSubscription}
                        disabled={isPortalLoading}
                        className="px-6 py-2.5 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {isPortalLoading ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                        Manage Subscription
                      </button>
                    )}
                    {isPro && (
                      <p className="text-blue-100 text-sm">Next billing date: Coming soon</p>
                    )}
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">Subscription Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Invoices', free: '5 per month', pro: 'Unlimited', active: true },
                    { label: 'Clients', free: 'Max 10', pro: 'Unlimited', active: true },
                    { label: 'Templates', free: '1 Basic', pro: 'All Professional', active: true },
                    { label: 'AI Features', free: 'No Access', pro: 'Unlimited Access', active: isPro },
                    { label: 'Receipt Scanner', free: 'No Access', pro: 'Unlimited Access', active: isPro },
                    { label: 'Recurring Invoices', free: 'No Access', pro: 'Unlimited Access', active: isPro },
                  ].map((benefit, i) => (
                    <div key={i} className="p-4 border border-gray-100 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{benefit.label}</p>
                        <p className="text-xs text-gray-500">{isPro ? benefit.pro : benefit.free}</p>
                      </div>
                      {benefit.active ? (
                        <div className="w-6 h-6 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                          <Check size={14} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center">
                          <XCircle size={14} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {isPro && (
                <div className="pt-6 border-t border-gray-100">
                  <button 
                    onClick={handleManageSubscription}
                    className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    View Billing History & Invoices
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
