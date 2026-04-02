import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  PlusCircle,
  Menu,
  X,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ChatBot } from './ChatBot';
import { PaywallModal } from './PaywallModal';

const SidebarItem = ({ icon: Icon, label, to, active, isPro }: { icon: any, label: string, to: string, active: boolean, isPro?: boolean, key?: string }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group",
      active 
        ? "bg-blue-50 text-blue-600 font-medium" 
        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
    )}
  >
    <div className="flex items-center gap-3">
      <Icon size={20} className={cn(active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />
      <span>{label}</span>
    </div>
    {isPro && (
      <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
        PRO
      </span>
    )}
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, profile } = useAuth();
  const { isPro, isFree } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showPaywall, setShowPaywall] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: FileText, label: 'Invoices', to: '/invoices' },
    { icon: Clock, label: 'Recurring', to: '/recurring', isPro: true },
    { icon: PlusCircle, label: 'Templates', to: '/templates' },
    { icon: Users, label: 'Clients', to: '/clients' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold text-gray-900">InvoiceFlow</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              icon={item.icon}
              label={item.label}
              to={item.to}
              isPro={item.isPro}
              active={location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to))} 
            />
          ))}
        </nav>

        {isFree && (
          <div className="mb-6 p-4 bg-blue-600 rounded-2xl text-white relative overflow-hidden group cursor-pointer" onClick={() => navigate('/pricing')}>
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:scale-110 transition-transform">
              <Sparkles size={40} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Upgrade Now</p>
            <p className="text-sm font-black mb-3">Unlock AI & Unlimited Growth</p>
            <button className="w-full py-2 bg-white text-blue-600 rounded-xl text-xs font-black hover:bg-blue-50 transition-all">
              Go Pro
            </button>
          </div>
        )}

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {profile?.name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profile?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="text-white" size={18} />
          </div>
          <span className="text-lg font-bold text-gray-900">InvoiceFlow</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-500">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 bg-white z-40 pt-20 px-6 md:hidden"
          >
            <nav className="space-y-2">
              {navItems.map((item) => (
                <SidebarItem 
                  key={item.to} 
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  active={location.pathname === item.to} 
                />
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
      <ChatBot onPaywall={() => setShowPaywall(true)} />
      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)}
        featureName="AI Assistant"
        featureDescription="Our AI assistant can help you write notes, analyze invoices, and answer your billing questions instantly."
      />
    </div>
  );
};
