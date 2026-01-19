import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Share2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import { generateInvoicePDF, preloadPDFAssets } from '../../utils/pdfGenerator';

const PDFViewer = () => {
  const navigate = useNavigate();
  const { currentInvoice } = useApp();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentInvoice) {
      generatePreview();
    }
  }, [currentInvoice]);

  const generatePreview = async () => {
    try {
      // Preload logo and QR images first
      await preloadPDFAssets();
      const pdf = generateInvoicePDF(currentInvoice);
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!currentInvoice) return;
    await preloadPDFAssets();
    const pdf = generateInvoicePDF(currentInvoice);
    pdf.save(`${currentInvoice.invoice_id}.pdf`);
  };

  const handleShare = () => {
    navigate('/invoice/share');
  };

  if (!currentInvoice) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header 
        title="Invoice Preview" 
        showBack
        onBack={() => navigate('/dashboard')}
        rightAction={
          <button
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Download className="w-5 h-5 text-gray-700" />
          </button>
        }
      />

      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : (
          /* PDF Preview Card - styled representation */
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Luxury Header with Logo and QR */}
            <div className="bg-gradient-to-r from-[#A3345D] to-[#8A2B4E] p-4">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <img 
                  src="/logo.png" 
                  alt="JS Fashion" 
                  className="w-16 h-16 rounded-full object-cover"
                />
                
                {/* Center - Business Name */}
                <div className="text-center flex-1 px-2">
                  <h1 className="font-serif text-xl font-bold text-white tracking-wide">
                    JS Fashion
                  </h1>
                  <div className="flex items-center gap-2 justify-center mt-1">
                    <div className="h-px w-6 bg-luxury-gold" />
                    <span className="text-luxury-gold text-[10px] tracking-[0.15em]">JEWELLERY</span>
                    <div className="h-px w-6 bg-luxury-gold" />
                  </div>
                  <h2 className="font-serif text-base text-luxury-gold tracking-wider mt-2">INVOICE</h2>
                </div>
                
                {/* QR Code */}
                <div className="text-center">
                  <img 
                    src="/instagram-qr.png" 
                    alt="Instagram QR" 
                    className="w-12 h-12 rounded object-cover"
                  />
                  <p className="text-[8px] text-white mt-1">@jsfashionjewels</p>
                </div>
              </div>
            </div>

            {/* Invoice Content */}
            <div className="p-6">
              {/* Invoice Details */}
              <div className="flex justify-between mb-6 text-sm">
                <div>
                  <p className="text-gray-500">Invoice No.</p>
                  <p className="font-semibold">{currentInvoice.invoice_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Date</p>
                  <p className="font-semibold">
                    {new Date(currentInvoice.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Customer */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bill To</p>
                <p className="font-semibold">{currentInvoice.customer_name || 'Customer'}</p>
                <p className="text-gray-600">{currentInvoice.customer_phone}</p>
                {currentInvoice.customer_address && (
                  <p className="text-gray-500 text-sm">{currentInvoice.customer_address}</p>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full mb-6 text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">Item</th>
                    <th className="text-center py-2 text-gray-500 font-medium">Qty</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2">{item.type}</td>
                      <td className="py-2 text-center">{item.qty}</td>
                      <td className="py-2 text-right">₹{(item.value * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₹{currentInvoice.subtotal.toLocaleString()}</span>
                </div>
                {currentInvoice.discount_percent > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Discount ({currentInvoice.discount_percent}%)</span>
                    <span>- ₹{currentInvoice.discount_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-base">Total</span>
                  <span className="font-bold text-lg text-luxury-purple">
                    ₹{currentInvoice.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-6 text-center">
                <span className={`
                  inline-block px-4 py-1 rounded-full text-sm font-medium
                  ${currentInvoice.status === 'paid' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'}
                `}>
                  {currentInvoice.status === 'paid' ? '✓ PAID' : '⏳ PENDING'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 text-center">
              <p className="text-sm text-[#A3345D] font-serif italic mb-1">Thank you for your business!</p>
              <p className="text-xs text-gray-500">JS Fashion Jewellery  |  📞 +91 84315 63827  |  📷 @jsfashionjewels</p>
            </div>
          </div>
        )}
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
    </div>
  );
};

export default PDFViewer;
