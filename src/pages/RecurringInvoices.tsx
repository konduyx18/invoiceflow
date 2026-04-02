import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  Loader2,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { recurringService } from '../services/recurringService';
import { clientService } from '../services/clientService';
import { templateService } from '../services/templateService';
import { RecurringInvoice, Client, RecurringFrequency, InvoiceTemplate } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { PaywallModal } from '../components/PaywallModal';

export const RecurringInvoices: React.FC = () => {
  const { profile } = useAuth();
  const { isFree } = useSubscription();
  const navigate = useNavigate();
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  
  // New Recurring Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.uid) {
      const unsubscribe = recurringService.getRecurringInvoices(profile.uid, (data) => {
        setRecurringInvoices(data);
        setLoading(false);
      });
      
      clientService.getClients(profile.uid, (data) => {
        setClients(data);
      });

      templateService.getTemplates(profile.uid, (data) => {
        setTemplates(data);
      });

      return () => unsubscribe();
    }
  }, [profile?.uid]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedTemplateId || !profile?.uid) return;

    setIsSubmitting(true);
    try {
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      if (!selectedTemplate) throw new Error('Template not found');

      const subtotal = selectedTemplate.items.reduce((acc, item) => acc + item.amount, 0);
      const taxAmount = subtotal * (selectedTemplate.taxRate / 100);
      const discountAmount = subtotal * (selectedTemplate.discountPercent / 100);
      const totalAmount = subtotal + taxAmount - discountAmount;

      const template = {
        userId: profile.uid,
        clientId: selectedClientId,
        subtotal,
        taxRate: selectedTemplate.taxRate,
        taxAmount,
        discountPercent: selectedTemplate.discountPercent,
        discountAmount,
        totalAmount,
        currency: selectedTemplate.currency,
        notes: selectedTemplate.notes || 'Recurring Invoice',
        paymentTerms: selectedTemplate.paymentTerms || 'Net 30',
        items: selectedTemplate.items
      };

      await recurringService.createRecurringInvoice(profile.uid, {
        userId: profile.uid,
        clientId: selectedClientId,
        frequency,
        startDate,
        endDate: endDate || undefined,
        nextGenerationDate: startDate,
        isActive: true,
        template
      });

      setShowAddModal(false);
      // Reset form
      setSelectedClientId('');
      setFrequency('MONTHLY');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
    } catch (error) {
      console.error('Error creating recurring invoice:', error);
      alert('Failed to create recurring invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (recurring: RecurringInvoice) => {
    try {
      await recurringService.updateRecurringInvoice(recurring.id, {
        isActive: !recurring.isActive
      });
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recurring invoice?')) {
      try {
        await recurringService.deleteRecurringInvoice(id);
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const handleOpenAddModal = () => {
    if (isFree) {
      setShowPaywall(true);
      return;
    }
    setShowAddModal(true);
  };

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recurring Invoices</h1>
            <p className="text-gray-500">Automate your billing for long-term clients.</p>
          </div>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          <Plus size={20} />
          Setup Recurring
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recurringInvoices.map((recurring) => {
          const client = clients.find(c => c.id === recurring.clientId);
          return (
            <div key={recurring.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  recurring.isActive ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"
                )}>
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{client?.name || 'Unknown Client'}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                      {recurring.frequency}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} /> Next: {formatDate(recurring.nextGenerationDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-gray-400 uppercase">Status</p>
                  <p className={cn(
                    "text-sm font-bold",
                    recurring.isActive ? "text-green-600" : "text-gray-400"
                  )}>
                    {recurring.isActive ? 'Active' : 'Paused'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleStatus(recurring)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      recurring.isActive ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"
                    )}
                    title={recurring.isActive ? "Pause" : "Resume"}
                  >
                    {recurring.isActive ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                  </button>
                  <button 
                    onClick={() => handleDelete(recurring.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {recurringInvoices.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="text-gray-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No recurring invoices</h3>
            <p className="text-gray-500 mt-1">Set up automated billing for your regular clients.</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
              Setup your first one
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <form onSubmit={handleCreate}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Setup Recurring Invoice</h3>
                  <button type="button" onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <XCircle size={20} className="text-gray-400" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Client</label>
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                      <option value="">Select a client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Template</label>
                    <select 
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                    >
                      <option value="">Select a template</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Frequency</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                    >
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
                      <input 
                        type="date" 
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date (Optional)</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                    Create Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <PaywallModal 
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Recurring Invoices"
        featureDescription="Automate your billing by setting up recurring invoice schedules for your regular clients."
      />
    </div>
  );
};
