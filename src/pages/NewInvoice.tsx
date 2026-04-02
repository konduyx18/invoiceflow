import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Send,
  UserPlus,
  Search,
  Camera,
  Loader2,
  Check,
  AlertCircle,
  Copy
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { clientService } from '../services/clientService';
import { invoiceService } from '../services/invoiceService';
import { geminiService } from '../services/geminiService';
import { templateService } from '../services/templateService';
import { Client, InvoiceItem, Invoice, InvoiceTemplate } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { PaywallModal } from '../components/PaywallModal';
import { Sparkles } from 'lucide-react';

export const NewInvoice: React.FC = () => {
  const { profile } = useAuth();
  const { isFree, canCreateInvoice } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState({ name: '', description: '' });

  useEffect(() => {
    if (profile?.uid) {
      const unsubscribeClients = clientService.getClients(profile.uid, (data) => {
        setClients(data);
      });
      const unsubscribeTemplates = templateService.getTemplates(profile.uid, (data) => {
        setTemplates(data);
      });
      return () => {
        unsubscribeClients();
        unsubscribeTemplates();
      };
    }
  }, [profile?.uid]);

  useEffect(() => {
    const state = location.state as { template?: InvoiceTemplate };
    if (state?.template) {
      applyTemplate(state.template);
    }
  }, [location.state]);

  const applyTemplate = (template: InvoiceTemplate) => {
    setItems(template.items.map(item => ({ ...item })));
    setTaxRate(template.taxRate);
    setDiscountPercent(template.discountPercent);
    setNotes(template.notes || '');
    setPaymentTerms(template.paymentTerms || 'Net 30');
  };

  const handleTemplateChange = (templateId: string) => {
    if (isFree && templates.findIndex(t => t.id === templateId) > 0) {
      setPaywallFeature({
        name: 'Multiple Templates',
        description: 'Free users can only use one basic template. Upgrade to Pro to unlock all professional templates.'
      });
      setShowPaywall(true);
      return;
    }
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      applyTemplate(template);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      item.amount = item.quantity * item.unitPrice;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const discountAmount = subtotal * (discountPercent / 100);
  const totalAmount = subtotal + taxAmount - discountAmount;

  const handleScanClick = () => {
    if (isFree) {
      setPaywallFeature({
        name: 'AI Receipt Scanner',
        description: 'Scan receipts and invoices with AI to automatically extract data and save time.'
      });
      setShowPaywall(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await geminiService.analyzeReceipt(base64, file.type);
        setScanResult(result);
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Scan error:', error);
      alert('Failed to scan document. Please try again.');
      setIsScanning(false);
    }
  };

  const applyScanResult = () => {
    if (!scanResult) return;

    // Try to find matching client
    const matchingClient = clients.find(c => 
      c.name.toLowerCase().includes(scanResult.clientName?.toLowerCase()) ||
      c.company?.toLowerCase().includes(scanResult.clientName?.toLowerCase())
    );

    if (matchingClient) {
      setSelectedClientId(matchingClient.id);
    }

    if (scanResult.items && scanResult.items.length > 0) {
      setItems(scanResult.items.map((item: any) => ({
        description: item.description || 'Scanned Item',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        amount: (item.quantity || 1) * (item.unitPrice || 0)
      })));
    }

    if (scanResult.taxAmount) {
      // Approximate tax rate if possible, or just set items and subtotal
      // For simplicity, we'll just set the items and let the user adjust tax rate
    }

    if (scanResult.paymentTerms) {
      setPaymentTerms(scanResult.paymentTerms);
    }

    setScanResult(null);
  };

  const handleSubmit = async (status: 'DRAFT' | 'SENT') => {
    if (!canCreateInvoice) {
      setPaywallFeature({
        name: 'Unlimited Invoices',
        description: 'You\'ve reached your free limit of 5 invoices per month. Upgrade to Pro for unlimited invoices.'
      });
      setShowPaywall(true);
      return;
    }

    if (!selectedClientId) {
      alert('Please select a client');
      return;
    }
    if (!dueDate) {
      alert('Please select a due date');
      return;
    }

    setIsSubmitting(true);
    try {
      const invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: profile!.uid,
        clientId: selectedClientId,
        invoiceNumber,
        status,
        issueDate,
        dueDate,
        subtotal,
        taxRate,
        taxAmount,
        discountPercent,
        discountAmount,
        totalAmount,
        currency: 'USD',
        notes,
        paymentTerms,
        items
      };

      await invoiceService.createInvoice(profile!.uid, invoice);
      navigate('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />
          <button 
            onClick={handleScanClick}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Camera size={18} />
                📸 Scan Receipt
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scan Result Review */}
      {scanResult && (
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800">
              <Check size={20} className="text-blue-600" />
              <h3 className="font-bold">Scan Complete! Review Extracted Data</h3>
            </div>
            <button 
              onClick={() => setScanResult(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-blue-100">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Detected Client</p>
              <p className="font-bold text-gray-900">{scanResult.clientName || 'Unknown'}</p>
              {!clients.find(c => c.name.toLowerCase().includes(scanResult.clientName?.toLowerCase())) && (
                <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
                  <AlertCircle size={10} /> Client not found in your database.
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Amount</p>
              <p className="font-bold text-gray-900">{formatCurrency(scanResult.totalAmount || 0)}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Line Items ({scanResult.items?.length || 0})</p>
              <div className="space-y-1">
                {scanResult.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-600">{item.description}</span>
                    <span className="font-medium">{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={applyScanResult}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            Auto-fill Form with this Data
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Client Details</h3>
              <Link to="/clients/new" className="text-sm text-blue-600 font-bold flex items-center gap-1 hover:underline">
                <UserPlus size={16} /> Add New Client
              </Link>
            </div>
            <div className="relative">
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name} ({client.company || client.email})</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Apply Template</h3>
              <Link to="/templates" className="text-sm text-blue-600 font-bold flex items-center gap-1 hover:underline">
                <Copy size={16} /> Manage Templates
              </Link>
            </div>
            <div className="relative">
              <select 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
              >
                <option value="">Select a template (optional)</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Copy size={18} />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Line Items</h3>
            <div className="space-y-4">
              <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider px-2">
                <div className="col-span-6">Description</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start group">
                  <div className="col-span-1 md:col-span-6">
                    <input 
                      type="text" 
                      placeholder="Item description"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <input 
                      type="number" 
                      placeholder="1"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-gray-900 w-full text-right">{formatCurrency(item.amount)}</span>
                    <button 
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              <button 
                onClick={handleAddItem}
                className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline mt-4"
              >
                <Plus size={18} /> Add Item
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Notes & Terms</h3>
            <textarea 
              placeholder="Additional notes or payment terms..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Invoice Settings */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Invoice Info</h3>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Invoice Number</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Issue Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Due Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment Terms</label>
              <select 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            {paymentTerms === 'Custom' && (
              <div>
                <input 
                  type="text" 
                  placeholder="Enter custom terms..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  onChange={(e) => setPaymentTerms(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Tax</span>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                    <input 
                      type="number" 
                      className="w-8 bg-transparent text-xs font-bold focus:outline-none"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                </div>
                <span className="text-sm text-gray-600">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Discount</span>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                    <input 
                      type="number" 
                      className="w-8 bg-transparent text-xs font-bold focus:outline-none"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                </div>
                <span className="text-sm text-gray-600">-{formatCurrency(discountAmount)}</span>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => handleSubmit('SENT')}
              disabled={isSubmitting}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={20} /> Send Invoice
            </button>
            <button 
              onClick={() => handleSubmit('DRAFT')}
              disabled={isSubmitting}
              className="w-full py-4 bg-white text-gray-900 border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={20} /> Save as Draft
            </button>
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
