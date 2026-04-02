import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Mail, 
  CheckCircle, 
  Edit2, 
  Trash2,
  Printer,
  Clock,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { invoiceService } from '../services/invoiceService';
import { clientService } from '../services/clientService';
import { Invoice, Client } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (profile?.uid && id) {
        const inv = await invoiceService.getInvoice(profile.uid, id);
        if (inv) {
          setInvoice(inv);
          const cl = await clientService.getClient(profile.uid, inv.clientId);
          setClient(cl);
        }
        setLoading(false);
      }
    };
    loadData();
  }, [profile?.uid, id]);

  const handleMarkAsPaid = async () => {
    if (invoice && profile) {
      await invoiceService.updateStatus(profile.uid, invoice.id, 'PAID');
      setInvoice({ ...invoice, status: 'PAID', paidAt: new Date().toISOString() });
    }
  };

  const generatePDF = () => {
    if (!invoice || !client || !profile) return;

    const doc = new jsPDF();
    
    // Brand Color
    const brandColor = [37, 99, 235]; // #2563EB
    
    // Header background
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 0, 210, 60, 'F');
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 140, 30);
    
    // Company Info
    doc.setFontSize(14);
    doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.text(profile.companyName || profile.name || 'Your Company', 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.companyAddress || '', 20, 32);
    doc.text(profile.email, 20, 37);
    doc.text(profile.phone || '', 20, 42);

    // Invoice Meta
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('Invoice #:', 140, 40);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoiceNumber, 170, 40);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Date:', 140, 45);
    doc.setTextColor(31, 41, 55);
    doc.text(formatDate(invoice.issueDate), 170, 45);
    
    doc.setTextColor(107, 114, 128);
    doc.text('Due Date:', 140, 50);
    doc.setTextColor(31, 41, 55);
    doc.text(formatDate(invoice.dueDate), 170, 50);

    if (invoice.paymentTerms) {
      doc.setTextColor(107, 114, 128);
      doc.text('Terms:', 140, 55);
      doc.setTextColor(31, 41, 55);
      doc.text(invoice.paymentTerms, 170, 55);
    }

    // Bill To
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', 20, 75);
    
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text(client.name, 20, 82);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    if (client.company) doc.text(client.company, 20, 87);
    const addressY = client.company ? 92 : 87;
    doc.text(client.address || '', 20, addressY);
    doc.text(`${client.city || ''}, ${client.state || ''} ${client.zipCode || ''}`, 20, addressY + 5);
    doc.text(client.email, 20, addressY + 10);

    // Items Table
    const tableData = invoice.items.map(item => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      formatCurrency(item.amount)
    ]);

    (doc as any).autoTable({
      startY: 115,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: brandColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      margin: { left: 20, right: 20 }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    const totalX = 140;
    const valueX = 190;

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('Subtotal:', totalX, finalY);
    doc.setTextColor(31, 41, 55);
    doc.text(formatCurrency(invoice.subtotal), valueX, finalY, { align: 'right' });
    
    doc.setTextColor(107, 114, 128);
    doc.text(`Tax (${invoice.taxRate}%):`, totalX, finalY + 7);
    doc.setTextColor(31, 41, 55);
    doc.text(formatCurrency(invoice.taxAmount), valueX, finalY + 7, { align: 'right' });
    
    doc.setTextColor(107, 114, 128);
    doc.text(`Discount (${invoice.discountPercent}%):`, totalX, finalY + 14);
    doc.setTextColor(31, 41, 55);
    doc.text(`-${formatCurrency(invoice.discountAmount)}`, valueX, finalY + 14, { align: 'right' });
    
    // Total Box
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.rect(totalX - 5, finalY + 20, 60, 12, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', totalX, finalY + 28);
    doc.text(formatCurrency(invoice.totalAmount), valueX, finalY + 28, { align: 'right' });

    // Notes & Terms
    let currentY = finalY + 50;
    if (invoice.notes) {
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES & TERMS', 20, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      const splitNotes = doc.splitTextToSize(invoice.notes, 170);
      doc.text(splitNotes, 20, currentY + 7);
      currentY += (splitNotes.length * 5) + 15;
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Thank you for your business!', 105, 285, { align: 'center' });

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="h-96 bg-gray-200 rounded-3xl"></div>
    </div>;
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900">Invoice not found</h2>
        <Link to="/invoices" className="text-blue-600 font-bold mt-4 inline-block">Back to Invoices</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                invoice.status === 'PAID' ? "bg-green-50 text-green-600" :
                invoice.status === 'SENT' ? "bg-blue-50 text-blue-600" :
                invoice.status === 'OVERDUE' ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
              )}>
                {invoice.status}
              </span>
              <span className="text-xs text-gray-500">Issued on {formatDate(invoice.issueDate)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <Download size={18} /> PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all">
            <Mail size={18} /> Send
          </button>
          {invoice.status !== 'PAID' && (
            <button 
              onClick={handleMarkAsPaid}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
            >
              <CheckCircle size={18} /> Mark as Paid
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Invoice Preview */}
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-16">
            <div>
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{profile?.companyName || profile?.name || 'Your Company'}</h2>
              <p className="text-gray-500 mt-1">{profile?.companyAddress}</p>
              <p className="text-gray-500">{profile?.email}</p>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-black text-gray-900 mb-6">INVOICE</h1>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Invoice Number: <span className="font-bold text-gray-900">{invoice.invoiceNumber}</span></p>
                <p className="text-sm text-gray-500">Issue Date: <span className="font-bold text-gray-900">{formatDate(invoice.issueDate)}</span></p>
                <p className="text-sm text-gray-500">Due Date: <span className="font-bold text-gray-900">{formatDate(invoice.dueDate)}</span></p>
                {invoice.paymentTerms && (
                  <p className="text-sm text-gray-500">Terms: <span className="font-bold text-gray-900">{invoice.paymentTerms}</span></p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Bill To</h4>
              <h3 className="text-xl font-bold text-gray-900">{client?.name}</h3>
              <p className="text-gray-500 mt-1">{client?.company}</p>
              <p className="text-gray-500">{client?.address}</p>
              <p className="text-gray-500">{client?.city}, {client?.state} {client?.zipCode}</p>
              <p className="text-gray-500">{client?.email}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-16">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
                  <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Qty</th>
                  <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Unit Price</th>
                  <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-6">
                      <p className="font-bold text-gray-900">{item.description}</p>
                    </td>
                    <td className="py-6 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-6 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-6 text-right font-bold text-gray-900">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-80 space-y-4">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Tax ({invoice.taxRate}%)</span>
                <span className="font-bold text-gray-900">{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Discount ({invoice.discountPercent}%)</span>
                <span className="font-bold text-gray-900">-{formatCurrency(invoice.discountAmount)}</span>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total Amount</span>
                <span className="text-3xl font-black text-blue-600">{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          {invoice.notes && (
            <div className="mt-20 pt-10 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Notes & Terms</h4>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
