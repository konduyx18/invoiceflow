import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Mic,
  MicOff,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { invoiceService } from '../services/invoiceService';
import { clientService } from '../services/clientService';
import { geminiService } from '../services/geminiService';
import { recurringService } from '../services/recurringService';
import { Invoice, Client } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PaywallModal } from '../components/PaywallModal';
import { Sparkles } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const StatCard = ({ title, amount, icon: Icon, color, trend }: { title: string, amount: number, icon: any, color: string, trend?: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1",
          trend.startsWith('+') ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        )}>
          {trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </span>
      )}
    </div>
    <p className="text-sm text-gray-500 mb-1">{title}</p>
    <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</h3>
  </div>
);

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const { isFree, canCreateInvoice, remainingInvoices } = useSubscription();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceResult, setVoiceResult] = useState<any>(null);
  const [transcript, setTranscript] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState({ name: '', description: '' });

  useEffect(() => {
    if (profile?.uid) {
      // Process recurring invoices on dashboard load
      recurringService.processRecurringInvoices(profile.uid).catch(console.error);

      const unsubscribe = invoiceService.getInvoices(profile.uid, (data) => {
        setInvoices(data);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [profile?.uid]);

  const startListening = () => {
    if (isFree) {
      setPaywallFeature({
        name: 'Voice Invoice Creation',
        description: 'Create invoices just by speaking. Our AI will parse your voice and fill out the form for you.'
      });
      setShowPaywall(true);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      handleVoiceCommand(text);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    try {
      const result = await geminiService.parseVoiceCommand(text);
      setVoiceResult(result);
    } catch (error) {
      console.error('Voice parse error:', error);
      alert('Failed to process voice command.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmVoiceInvoice = async () => {
    if (!voiceResult || !profile?.uid) return;

    try {
      // Find client
      const clients = await clientService.getClientsOnce(profile.uid);
      const client = clients.find(c => c.name.toLowerCase().includes(voiceResult.clientName?.toLowerCase()));

      if (!client) {
        alert(`Client "${voiceResult.clientName}" not found. Please create the client first.`);
        return;
      }

      const subtotal = voiceResult.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
      const invoiceData = {
        userId: profile.uid,
        clientId: client.id,
        invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "DRAFT" as const,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: voiceResult.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal,
        taxRate: 0,
        taxAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        totalAmount: subtotal,
        currency: "USD",
        notes: "Created via voice command",
        paymentTerms: voiceResult.paymentTerms || "Net 30",
        items: voiceResult.items.map((item: any) => ({ ...item, amount: item.quantity * item.unitPrice }))
      };

      await invoiceService.createInvoice(profile.uid, invoiceData);
      setVoiceResult(null);
      navigate('/invoices');
    } catch (error) {
      console.error('Error creating voice invoice:', error);
      alert('Failed to create invoice.');
    }
  };

  const stats = {
    totalRevenue: invoices.filter(i => i.status === 'PAID').reduce((acc, i) => acc + i.totalAmount, 0),
    pendingAmount: invoices.filter(i => i.status === 'SENT').reduce((acc, i) => acc + i.totalAmount, 0),
    overdueAmount: invoices.filter(i => i.status === 'OVERDUE').reduce((acc, i) => acc + i.totalAmount, 0),
    totalInvoices: invoices.length
  };

  // Mock data for chart
  const chartData = [
    { name: 'Jan', amount: 4000 },
    { name: 'Feb', amount: 3000 },
    { name: 'Mar', amount: 2000 },
    { name: 'Apr', amount: 2780 },
    { name: 'May', amount: 1890 },
    { name: 'Jun', amount: 2390 },
  ];

  const handleNewInvoice = () => {
    if (!canCreateInvoice) {
      setPaywallFeature({
        name: 'Unlimited Invoices',
        description: 'You\'ve reached your free limit of 5 invoices per month. Upgrade to Pro for unlimited invoices and growth.'
      });
      setShowPaywall(true);
      return;
    }
    navigate('/invoices/new');
  };

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      {isFree && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-blue-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="font-bold">You're on the Free plan</p>
              <p className="text-sm text-blue-100">
                {remainingInvoices === 1 
                  ? "You have 1 free invoice remaining this month." 
                  : remainingInvoices === 0 
                    ? "You've reached your monthly limit. Upgrade to continue." 
                    : `You have ${remainingInvoices} free invoices remaining this month.`}
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/pricing')}
            className="px-6 py-2 bg-white text-blue-600 rounded-xl font-black text-sm hover:bg-blue-50 transition-all whitespace-nowrap"
          >
            Upgrade to Pro
          </button>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.name || 'User'}!</h1>
          <p className="text-gray-500">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={startListening}
            disabled={isListening || isProcessing}
            className={cn(
              "p-2.5 rounded-xl font-bold transition-all flex items-center gap-2 relative",
              isListening ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            )}
            title="Create invoice with voice"
          >
            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : isListening ? <MicOff size={20} /> : <Mic size={20} />}
            {isFree && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-[8px] font-black text-white px-1 rounded-sm">PRO</span>
            )}
          </button>
          <button 
            onClick={handleNewInvoice}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Plus size={20} />
            New Invoice
          </button>
        </div>
      </div>

      {/* Voice Confirmation Modal */}
      <AnimatePresence>
        {voiceResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Confirm Voice Invoice</h3>
                <button onClick={() => setVoiceResult(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">Transcript</p>
                  <p className="text-sm text-blue-900 italic">"{transcript}"</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Client</p>
                    <p className="font-bold text-gray-900">{voiceResult.clientName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Due Date</p>
                    <p className="font-bold text-gray-900">{voiceResult.dueDate}</p>
                  </div>
                  {voiceResult.paymentTerms && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Terms</p>
                      <p className="font-bold text-gray-900">{voiceResult.paymentTerms}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Items</p>
                    <div className="space-y-1 mt-1">
                      {voiceResult.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.description}</span>
                          <span className="font-medium">{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex gap-3">
                <button 
                  onClick={() => setVoiceResult(null)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmVoiceInvoice}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} /> Create Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          amount={stats.totalRevenue} 
          icon={TrendingUp} 
          color="bg-green-50 text-green-600"
          trend="+12.5%"
        />
        <StatCard 
          title="Pending" 
          amount={stats.pendingAmount} 
          icon={Clock} 
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Overdue" 
          amount={stats.overdueAmount} 
          icon={AlertCircle} 
          color="bg-red-50 text-red-600"
        />
        <StatCard 
          title="Total Invoices" 
          amount={stats.totalInvoices} 
          icon={CheckCircle2} 
          color="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#F9FAFB'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#2563EB' : '#DBEAFE'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Invoices</h3>
            <Link to="/invoices" className="text-sm text-blue-600 font-bold hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {invoices.slice(0, 5).map((invoice) => (
              <Link 
                key={invoice.id} 
                to={`/invoices/${invoice.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{formatDate(invoice.issueDate)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                    invoice.status === 'PAID' ? "bg-green-50 text-green-600" :
                    invoice.status === 'SENT' ? "bg-blue-50 text-blue-600" :
                    invoice.status === 'OVERDUE' ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
                  )}>
                    {invoice.status}
                  </span>
                </div>
              </Link>
            ))}
            {invoices.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500 text-sm">No invoices yet.</p>
                <Link to="/invoices/new" className="text-blue-600 text-sm font-bold mt-2 inline-block">Create your first</Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <PaywallModal 
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName={paywallFeature.name}
        featureDescription={paywallFeature.description}
      />
    </div>
  );
};
