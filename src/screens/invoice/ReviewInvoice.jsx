import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Toggle from '../../components/ui/Toggle';

const ReviewInvoice = () => {
  const navigate = useNavigate();
  const { invoiceDraft, updateDraft, calculateTotals, createInvoice } = useApp();
  
  const [discountEnabled, setDiscountEnabled] = useState(invoiceDraft.discount_enabled || false);
  const [discountPercent, setDiscountPercent] = useState(invoiceDraft.discount_percent || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = invoiceDraft.items || [];
  const { subtotal, discountAmount, total } = calculateTotals(items, discountPercent, discountEnabled);

  const handleDiscountToggle = (enabled) => {
    setDiscountEnabled(enabled);
    if (!enabled) {
      setDiscountPercent(0);
    }
  };

  const handleDiscountChange = (value) => {
    const percent = Math.min(100, Math.max(0, Number(value) || 0));
    setDiscountPercent(percent);
  };

  const handleGenerateInvoice = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Save discount settings to draft
      updateDraft({
        discount_enabled: discountEnabled,
        discount_percent: discountPercent
      });

      // Create the invoice (saves to Firestore)
      const invoice = await createInvoice({
        customer_name: invoiceDraft.customer_name,
        customer_phone: invoiceDraft.customer_phone,
        customer_address: invoiceDraft.customer_address,
        items: items,
        subtotal: subtotal,
        discount_percent: discountEnabled ? discountPercent : 0,
        discount_amount: discountAmount,
        total: total,
        status: 'pending'
      });

      console.log('Invoice created in Firestore:', invoice);
      navigate('/invoice/payment');
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Review Invoice" showBack />

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-1 rounded-full bg-primary-600" />
          <div className="flex-1 h-1 rounded-full bg-primary-600" />
          <div className="flex-1 h-1 rounded-full bg-primary-600" />
        </div>

        {/* Customer Info */}
        <Card className="p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Customer
          </h3>
          <p className="font-medium text-gray-900">
            {invoiceDraft.customer_name || 'Walk-in Customer'}
          </p>
          <p className="text-gray-600">{invoiceDraft.customer_phone}</p>
          {invoiceDraft.customer_address && (
            <p className="text-gray-500 text-sm mt-1">{invoiceDraft.customer_address}</p>
          )}
        </Card>

        {/* Items */}
        <Card className="p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Items ({items.length})
          </h3>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{item.type}</p>
                  <p className="text-sm text-gray-500">
                    ₹{item.value.toLocaleString()} × {item.qty}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  ₹{(item.value * item.qty).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Discount Section */}
        <Card className="p-4 mb-4">
          <Toggle
            enabled={discountEnabled}
            onChange={handleDiscountToggle}
            label="Apply Discount"
          />
          
          {discountEnabled && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={discountPercent}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    %
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 px-3 bg-amber-50 rounded-xl">
                <span className="text-amber-700">Discount Amount</span>
                <span className="font-semibold text-amber-700">
                  - ₹{discountAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Totals */}
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            
            {discountEnabled && discountAmount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Discount ({discountPercent}%)</span>
                <span>- ₹{discountAmount.toLocaleString()}</span>
              </div>
            )}
            
            <div className="pt-2 border-t border-gray-100 flex justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-primary-600">
                ₹{total.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 safe-area-bottom">
        <Button 
          fullWidth 
          size="lg" 
          onClick={handleGenerateInvoice}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Generate Invoice'}
        </Button>
      </div>
    </div>
  );
};

export default ReviewInvoice;
