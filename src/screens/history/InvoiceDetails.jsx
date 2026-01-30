import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, Share2, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import BottomSheet from '../../components/ui/BottomSheet';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

const InvoiceDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getInvoice, updateInvoice, deleteInvoice, setCurrentInvoice, invoices } = useApp();
  
  const [invoice, setInvoice] = useState(null);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const inv = getInvoice(id);
    if (inv) {
      setInvoice(inv);
      setCurrentInvoice(inv);
    } else {
      navigate('/history');
    }
  }, [id, invoices]);

  const handleDownload = () => {
    if (!invoice) return;
    const pdf = generateInvoicePDF(invoice);
    pdf.save(`${invoice.invoice_id}.pdf`);
  };

  const handleShare = async () => {
    if (!invoice) return;
    
    try {
      const pdf = generateInvoicePDF(invoice);
      const blob = pdf.output('blob');
      const file = new File([blob], `${invoice.invoice_id}.pdf`, { type: 'application/pdf' });

      const shareMessage = `JS Fashion Jewellery
Invoice: ${invoice.invoice_id}
Total: ₹${invoice.total.toLocaleString()}${invoice.discount_amount > 0 ? ` (includes discount)` : ''}`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice ${invoice.invoice_id}`,
          text: shareMessage
        });
      } else {
        pdf.save(`${invoice.invoice_id}.pdf`);
        const phone = invoice.customer_phone;
        const encodedMessage = encodeURIComponent(shareMessage);
        window.open(`https://wa.me/91${phone}?text=${encodedMessage}`, '_blank');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleStatusChange = (newStatus) => {
    updateInvoice(id, { status: newStatus });
    setInvoice(prev => ({ ...prev, status: newStatus }));
    setShowStatusSheet(false);
  };

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        title="Invoice Details" 
        showBack
        showHome
        rightAction={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDeleteSheet(true)}
              className="p-2 rounded-full hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Download className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        }
      />

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Header Card */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">{invoice.invoice_id}</p>
              <p className="text-xs text-gray-400">
                {new Date(invoice.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <button
              onClick={() => setShowStatusSheet(true)}
              className={`
                flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium
                ${invoice.status === 'paid' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-amber-100 text-amber-700'}
              `}
            >
              {invoice.status === 'paid' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              {invoice.status === 'paid' ? 'Paid' : 'Pending'}
            </button>
          </div>
          
          <div className="text-center py-4 border-t border-gray-100">
            <p className="text-3xl font-bold text-gray-900">
              ₹{invoice.total.toLocaleString()}
            </p>
            {invoice.discount_amount > 0 && (
              <p className="text-sm text-amber-600">
                Includes ₹{invoice.discount_amount.toLocaleString()} discount
              </p>
            )}
          </div>
        </Card>

        {/* Customer Info */}
        <Card className="p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Customer
          </h3>
          <p className="font-medium text-gray-900">
            {invoice.customer_name || 'Walk-in Customer'}
          </p>
          <p className="text-gray-600">{invoice.customer_phone}</p>
          {invoice.customer_address && (
            <p className="text-gray-500 text-sm mt-1">{invoice.customer_address}</p>
          )}
        </Card>

        {/* Items */}
        <Card className="p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Items ({invoice.items.length})
          </h3>
          <div className="space-y-3">
            {invoice.items.map((item, index) => {
              const itemTotal = item.value * item.qty;
              const itemDiscount = item.discount_percent ? Math.round(itemTotal * (item.discount_percent / 100)) : 0;
              const itemFinal = itemTotal - itemDiscount;
              
              return (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{item.type}</p>
                    <p className="text-sm text-gray-500">
                      ₹{item.value.toLocaleString()} × {item.qty}
                      {item.discount_percent > 0 && (
                        <span className="text-amber-600 ml-2">(-{item.discount_percent}%)</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    {item.discount_percent > 0 && (
                      <p className="text-xs text-gray-400 line-through">
                        ₹{itemTotal.toLocaleString()}
                      </p>
                    )}
                    <p className="font-semibold text-gray-900">
                      ₹{itemFinal.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Totals */}
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{invoice.subtotal.toLocaleString()}</span>
            </div>
            
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Total Discount</span>
                <span>- ₹{invoice.discount_amount.toLocaleString()}</span>
              </div>
            )}
            
            <div className="pt-2 border-t border-gray-100 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">₹{invoice.total.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 safe-area-bottom">
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleDownload} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleShare} className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Status Update Sheet */}
      <BottomSheet
        isOpen={showStatusSheet}
        onClose={() => setShowStatusSheet(false)}
        title="Update Payment Status"
      >
        <div className="space-y-3">
          <button
            onClick={() => handleStatusChange('paid')}
            className={`
              w-full p-4 rounded-xl flex items-center gap-4 transition-colors
              ${invoice.status === 'paid' 
                ? 'bg-green-100 border-2 border-green-500' 
                : 'bg-gray-50 hover:bg-gray-100'}
            `}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${invoice.status === 'paid' ? 'bg-green-500' : 'bg-green-100'}`}>
              <CheckCircle className={`w-5 h-5 ${invoice.status === 'paid' ? 'text-white' : 'text-green-500'}`} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Paid</p>
              <p className="text-sm text-gray-500">Payment received</p>
            </div>
          </button>

          <button
            onClick={() => handleStatusChange('pending')}
            className={`
              w-full p-4 rounded-xl flex items-center gap-4 transition-colors
              ${invoice.status === 'pending' 
                ? 'bg-amber-100 border-2 border-amber-500' 
                : 'bg-gray-50 hover:bg-gray-100'}
            `}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${invoice.status === 'pending' ? 'bg-amber-500' : 'bg-amber-100'}`}>
              <Clock className={`w-5 h-5 ${invoice.status === 'pending' ? 'text-white' : 'text-amber-500'}`} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Pending</p>
              <p className="text-sm text-gray-500">Payment due</p>
            </div>
          </button>
        </div>
      </BottomSheet>

      {/* Delete Confirmation Sheet */}
      <BottomSheet
        isOpen={showDeleteSheet}
        onClose={() => setShowDeleteSheet(false)}
        title="Delete Invoice"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete invoice{' '}
            <span className="font-semibold text-gray-900">{invoice?.invoice_id}</span>?
          </p>
          <p className="text-sm text-gray-500">
            This action cannot be undone.
          </p>
          
          <div className="flex gap-3 pt-2">
            <Button 
              variant="secondary" 
              onClick={() => setShowDeleteSheet(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                setIsDeleting(true);
                try {
                  await deleteInvoice(id);
                  navigate('/history');
                } catch (error) {
                  console.error('Error deleting invoice:', error);
                  alert('Failed to delete invoice');
                  setIsDeleting(false);
                }
              }}
              loading={isDeleting}
              className="flex-1 !bg-red-600 hover:!bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default InvoiceDetails;
