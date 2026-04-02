import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Trash2, 
  ArrowLeft,
  Loader2,
  XCircle,
  Check,
  Edit2,
  Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { templateService } from '../services/templateService';
import { InvoiceTemplate, InvoiceItem } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { PaywallModal } from '../components/PaywallModal';

export const Templates: React.FC = () => {
  const { profile } = useAuth();
  const { isFree } = useSubscription();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Omit<InvoiceItem, 'amount'>[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  useEffect(() => {
    if (profile?.uid) {
      const unsubscribe = templateService.getTemplates(profile.uid, (data) => {
        setTemplates(data);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [profile?.uid]);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof Omit<InvoiceItem, 'amount'>, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;

    setIsSubmitting(true);
    try {
      const templateData = {
        userId: profile.uid,
        name,
        description,
        items: items.map(item => ({ ...item, amount: item.quantity * item.unitPrice })),
        taxRate,
        discountPercent,
        currency,
        notes,
        paymentTerms
      };

      await templateService.createTemplate(profile.uid, templateData);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setTaxRate(0);
    setDiscountPercent(0);
    setCurrency('USD');
    setNotes('');
    setPaymentTerms('Net 30');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await templateService.deleteTemplate(id);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleOpenAddModal = () => {
    if (isFree && templates.length >= 1) {
      setShowPaywall(true);
      return;
    }
    setShowAddModal(true);
  };

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>)}
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
            <h1 className="text-2xl font-bold text-gray-900">Invoice Templates</h1>
            <p className="text-gray-500">Save time by reusing common invoice structures.</p>
          </div>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          <Plus size={20} />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{template.name}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description || 'No description provided.'}</p>
              
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase">Preview Items</p>
                <div className="space-y-1">
                  {template.items.slice(0, 2).map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600">
                      <span>{item.description}</span>
                      <span className="font-medium">{formatCurrency(item.unitPrice)}</span>
                    </div>
                  ))}
                  {template.items.length > 2 && (
                    <p className="text-[10px] text-gray-400">+{template.items.length - 2} more items</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {template.currency}
              </span>
              <button 
                onClick={() => navigate('/invoices/new', { state: { template } })}
                className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                Use Template <Plus size={14} />
              </button>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Copy className="text-gray-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No templates yet</h3>
            <p className="text-gray-500 mt-1">Create templates for your most common services or products.</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
              Create your first template
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
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              <form onSubmit={handleCreate} className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Create Invoice Template</h3>
                  <button type="button" onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <XCircle size={20} className="text-gray-400" />
                  </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Template Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g., Monthly Consulting"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                      <input 
                        type="text" 
                        placeholder="Optional description"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-500 uppercase">Line Items</label>
                      <button 
                        type="button"
                        onClick={addItem}
                        className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                      >
                        <Plus size={14} /> Add Item
                      </button>
                    </div>
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start">
                          <div className="flex-1">
                            <input 
                              type="text" 
                              required
                              placeholder="Description"
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                            />
                          </div>
                          <div className="w-20">
                            <input 
                              type="number" 
                              required
                              placeholder="Qty"
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                            />
                          </div>
                          <div className="w-28">
                            <input 
                              type="number" 
                              required
                              placeholder="Price"
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                            />
                          </div>
                          {items.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-2 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tax %</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount %</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Currency</label>
                      <select 
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Terms</label>
                      <select 
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                      >
                        <option value="Net 30">Net 30</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Due on Receipt">Due on Receipt</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Default Notes</label>
                    <textarea 
                      rows={2}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Thank you for your business!"
                    />
                  </div>
                </div>

                <div className="p-6 bg-gray-50 flex gap-3 mt-auto">
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
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                    Save Template
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
        featureName="Multiple Templates"
        featureDescription="Free users can only create one basic template. Upgrade to Pro to unlock unlimited professional templates."
      />
    </div>
  );
};
