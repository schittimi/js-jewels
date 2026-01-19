import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const PaymentStatus = () => {
  const navigate = useNavigate();
  const { currentInvoice, updateInvoice } = useApp();
  const [status, setStatus] = useState(currentInvoice?.status || 'pending');

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (currentInvoice) {
      updateInvoice(currentInvoice.id, { status: newStatus });
    }
  };

  const handleContinue = () => {
    navigate('/invoice/pdf');
  };

  if (!currentInvoice) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        title="Payment Status" 
        showBack 
        onBack={() => navigate('/dashboard')}
      />

      <div className="flex-1 px-4 py-6">
        {/* Invoice Summary */}
        <Card className="p-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">{currentInvoice.invoice_id}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              ₹{currentInvoice.total.toLocaleString()}
            </p>
            <p className="text-gray-600 mt-1">
              {currentInvoice.customer_name || currentInvoice.customer_phone}
            </p>
          </div>
        </Card>

        {/* Status Selection */}
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Mark Payment Status
        </h3>

        <div className="space-y-3">
          {/* Paid Option */}
          <Card
            hoverable
            onClick={() => handleStatusChange('paid')}
            className={`p-4 ${status === 'paid' ? 'ring-2 ring-green-500 border-green-500' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${status === 'paid' ? 'bg-green-500' : 'bg-green-100'}
              `}>
                <CheckCircle className={`w-6 h-6 ${status === 'paid' ? 'text-white' : 'text-green-500'}`} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Paid</h4>
                <p className="text-sm text-gray-500">Payment received</p>
              </div>
              {status === 'paid' && (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </Card>

          {/* Pending Option */}
          <Card
            hoverable
            onClick={() => handleStatusChange('pending')}
            className={`p-4 ${status === 'pending' ? 'ring-2 ring-amber-500 border-amber-500' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${status === 'pending' ? 'bg-amber-500' : 'bg-amber-100'}
              `}>
                <Clock className={`w-6 h-6 ${status === 'pending' ? 'text-white' : 'text-amber-500'}`} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Pending</h4>
                <p className="text-sm text-gray-500">Payment due</p>
              </div>
              {status === 'pending' && (
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 safe-area-bottom">
        <Button fullWidth size="lg" onClick={handleContinue}>
          View Invoice
        </Button>
      </div>
    </div>
  );
};

export default PaymentStatus;
