import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Mail, Link2, Bell, Check, Home, Loader2, Upload, CheckCircle, XCircle } from 'lucide-react';
import { ref, uploadBytes } from 'firebase/storage';
import { useApp } from '../../context/AppContext';
import { storage } from '../../config/firebase';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { generateInvoicePDF, preloadPDFAssets } from '../../utils/pdfGenerator';

// Get storage bucket from environment or construct from project ID
const STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 
  `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`;

// Generate direct public URL (works with public storage rules)
const getDirectPdfUrl = (invoiceId) => {
  const encodedPath = encodeURIComponent(`invoices/${invoiceId}.pdf`);
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media`;
};

const ShareInvoice = () => {
  const navigate = useNavigate();
  const { currentInvoice, resetDraft, updateInvoice } = useApp();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Background upload state
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'success' | 'error'

  if (!currentInvoice) {
    navigate('/dashboard');
    return null;
  }

  // Pre-formed direct URL - works immediately after upload completes
  const pdfUrl = getDirectPdfUrl(currentInvoice.invoice_id);

  const shareMessage = `JS Fashion Jewellery
Invoice: ${currentInvoice.invoice_id}
Total: ₹${currentInvoice.total.toLocaleString()}${currentInvoice.discount_percent > 0 ? ` (after ${currentInvoice.discount_percent}% discount)` : ''}
View attached invoice ↓`;

  // Background upload function (non-blocking)
  const uploadInBackground = async (blob) => {
    setUploadStatus('uploading');
    
    try {
      const fileName = `invoices/${currentInvoice.invoice_id}.pdf`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, blob, {
        contentType: 'application/pdf',
        customMetadata: {
          invoiceId: currentInvoice.invoice_id,
          customerName: currentInvoice.customer_name || ''
        }
      });
      
      // Mark invoice as having PDF uploaded
      await updateInvoice(currentInvoice.id, { pdfUploaded: true });
      
      setUploadStatus('success');
      
      // Auto-hide success after 5 seconds
      setTimeout(() => setUploadStatus(null), 5000);
    } catch (error) {
      console.error('Background upload failed:', error);
      setUploadStatus('error');
    }
  };

  const handleWhatsAppShare = async () => {
    try {
      setUploading(true);
      
      // Generate PDF
      await preloadPDFAssets();
      const pdf = generateInvoicePDF(currentInvoice);
      const blob = pdf.output('blob');

      // Format phone number
      let phone = currentInvoice.customer_phone.replace(/\D/g, '');
      if (phone.length === 10) {
        phone = '91' + phone;
      }

      // Create message with pre-formed PDF link (works after upload completes)
      const messageWithLink = `${shareMessage}\n\n📄 View/Download Invoice:\n${pdfUrl}`;
      const encodedMessage = encodeURIComponent(messageWithLink);
      
      // Open WhatsApp IMMEDIATELY with pre-formed URL
      window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`, '_blank');
      
      // Start background upload (non-blocking)
      uploadInBackground(blob);
      
      setShared('whatsapp');
      setUploading(false);
    } catch (error) {
      console.error('Error sharing:', error);
      alert(`Could not generate invoice: ${error.message}`);
      setUploading(false);
    }
  };

  const handleEmailShare = async () => {
    try {
      setUploading(true);
      
      // Generate PDF
      await preloadPDFAssets();
      const pdf = generateInvoicePDF(currentInvoice);
      const blob = pdf.output('blob');
      
      const subject = encodeURIComponent(`Invoice ${currentInvoice.invoice_id} - JS Fashion Jewellery`);
      const bodyWithLink = `${shareMessage}\n\nView/Download Invoice: ${pdfUrl}`;
      
      // Open email IMMEDIATELY
      window.open(`mailto:?subject=${subject}&body=${encodeURIComponent(bodyWithLink)}`, '_blank');
      
      // Start background upload (non-blocking)
      uploadInBackground(blob);
      
      setShared('email');
      setUploading(false);
    } catch (error) {
      console.error('Error sharing via email:', error);
      alert('Could not generate invoice. Please try again.');
      setUploading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const messageWithLink = `${shareMessage}\n\n📄 View/Download Invoice:\n${pdfUrl}`;
      await navigator.clipboard.writeText(messageWithLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleReminder = () => {
    let phone = currentInvoice.customer_phone.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    
    const reminderMessage = `Hi! This is a friendly reminder for your pending payment.

${shareMessage}

📄 View Invoice: ${pdfUrl}

Please let us know once payment is done. Thank you! 🙏`;
    
    const encodedMessage = encodeURIComponent(reminderMessage);
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`, '_blank');
  };

  const handleDone = () => {
    resetDraft();
    navigate('/dashboard');
  };

  const shareOptions = [
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      description: 'Share invoice link',
      color: 'bg-green-500',
      onClick: handleWhatsAppShare,
      shared: shared === 'whatsapp',
      disabled: uploading
    },
    {
      icon: Mail,
      label: 'Email',
      description: 'Send via email',
      color: 'bg-blue-500',
      onClick: handleEmailShare,
      shared: shared === 'email',
      disabled: uploading
    },
    {
      icon: Link2,
      label: copied ? 'Copied!' : 'Copy Message',
      description: 'Copy invoice details with link',
      color: 'bg-gray-500',
      onClick: handleCopyLink,
      shared: copied
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        title="Share Invoice" 
        showBack
        showHome
        onBack={() => navigate('/invoice/pdf')}
      />

      <div className="flex-1 px-4 py-6">
        {/* Invoice Summary */}
        <Card className="p-4 mb-6">
          <div className="text-center">
            <div className={`
              inline-flex items-center justify-center w-12 h-12 rounded-full mb-3
              ${currentInvoice.status === 'paid' ? 'bg-green-100' : 'bg-amber-100'}
            `}>
              <Check className={`w-6 h-6 ${currentInvoice.status === 'paid' ? 'text-green-600' : 'text-amber-600'}`} />
            </div>
            <p className="text-lg font-semibold text-gray-900">Invoice Generated!</p>
            <p className="text-gray-500">{currentInvoice.invoice_id}</p>
            <p className="text-2xl font-bold text-primary-600 mt-2">
              ₹{currentInvoice.total.toLocaleString()}
            </p>
          </div>
        </Card>

        {/* Share Options */}
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Share Invoice
        </h3>

        <div className="space-y-3 mb-6">
          {shareOptions.map((option, index) => (
            <Card
              key={index}
              hoverable
              onClick={option.disabled ? undefined : option.onClick}
              className={`p-4 ${option.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`${option.color} w-12 h-12 rounded-full flex items-center justify-center`}>
                  <option.icon className={`w-6 h-6 text-white ${uploading ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{option.label}</h4>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </div>
                {option.shared && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Background Upload Status */}
        {uploadStatus && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            uploadStatus === 'uploading' ? 'bg-blue-50 border border-blue-200' :
            uploadStatus === 'success' ? 'bg-green-50 border border-green-200' :
            'bg-red-50 border border-red-200'
          }`}>
            {uploadStatus === 'uploading' && (
              <>
                <Upload className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700">Uploading PDF in background...</p>
                  <p className="text-xs text-blue-500">Link will work once upload completes</p>
                </div>
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </>
            )}
            {uploadStatus === 'success' && (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700">PDF uploaded successfully!</p>
                  <p className="text-xs text-green-500">Customer can now view the invoice</p>
                </div>
              </>
            )}
            {uploadStatus === 'error' && (
              <>
                <XCircle className="w-5 h-5 text-red-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-700">Upload failed</p>
                  <p className="text-xs text-red-500">Try sharing again</p>
                </div>
                <button
                  onClick={() => setUploadStatus(null)}
                  className="px-3 py-1.5 bg-red-100 text-red-600 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors"
                >
                  Dismiss
                </button>
              </>
            )}
          </div>
        )}

        {/* Reminder Option - Only for pending invoices */}
        {currentInvoice.status === 'pending' && (
          <>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Payment Reminder
            </h3>
            <Card hoverable onClick={handleReminder} className="p-4">
              <div className="flex items-center gap-4">
                <div className="bg-amber-500 w-12 h-12 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Send Reminder</h4>
                  <p className="text-sm text-gray-500">Remind customer about payment</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 safe-area-bottom">
        <Button fullWidth size="lg" onClick={handleDone}>
          <Home className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default ShareInvoice;
