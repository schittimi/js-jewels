import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Mail, Link2, Bell, Check, Home, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useApp } from '../../context/AppContext';
import { storage } from '../../config/firebase';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { generateInvoicePDF, preloadPDFAssets } from '../../utils/pdfGenerator';

const ShareInvoice = () => {
  const navigate = useNavigate();
  const { currentInvoice, resetDraft } = useApp();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!currentInvoice) {
    navigate('/dashboard');
    return null;
  }

  const shareMessage = `JS Fashion Jewellery
Invoice: ${currentInvoice.invoice_id}
Total: ₹${currentInvoice.total.toLocaleString()}${currentInvoice.discount_percent > 0 ? ` (after ${currentInvoice.discount_percent}% discount)` : ''}
View attached invoice ↓`;

  const handleWhatsAppShare = async () => {
    try {
      setUploading(true);
      
      // Preload images and generate PDF
      await preloadPDFAssets();
      const pdf = generateInvoicePDF(currentInvoice);
      const blob = pdf.output('blob');

      // Format phone number - remove any non-digits and ensure country code
      let phone = currentInvoice.customer_phone.replace(/\D/g, '');
      if (phone.length === 10) {
        phone = '91' + phone;
      }

      // Upload PDF to Firebase Storage
      const fileName = `invoices/${currentInvoice.invoice_id}.pdf`;
      const storageRef = ref(storage, fileName);
      
      // Upload with public read metadata
      await uploadBytes(storageRef, blob, {
        contentType: 'application/pdf',
        customMetadata: {
          invoiceId: currentInvoice.invoice_id,
          customerName: currentInvoice.customer_name
        }
      });
      
      // Get the public download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Create message with PDF link
      const messageWithLink = `${shareMessage}\n\n📄 View/Download Invoice:\n${downloadURL}`;
      const encodedMessage = encodeURIComponent(messageWithLink);
      
      // Open WhatsApp with the message containing the PDF link
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
      
      setShared('whatsapp');
    } catch (error) {
      console.error('Error sharing:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      alert(`Could not upload invoice: ${error.code || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleEmailShare = async () => {
    try {
      setUploading(true);
      
      // Preload images and generate PDF
      await preloadPDFAssets();
      const pdf = generateInvoicePDF(currentInvoice);
      const blob = pdf.output('blob');
      
      // Upload PDF to Firebase Storage
      const fileName = `invoices/${currentInvoice.invoice_id}.pdf`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, blob, {
        contentType: 'application/pdf',
        customMetadata: {
          invoiceId: currentInvoice.invoice_id,
          customerName: currentInvoice.customer_name
        }
      });
      
      // Get the public download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      const subject = encodeURIComponent(`Invoice ${currentInvoice.invoice_id} - JS Fashion Jewellery`);
      const bodyWithLink = `${shareMessage}\n\nView/Download Invoice: ${downloadURL}`;
      const body = encodeURIComponent(bodyWithLink);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      setShared('email');
    } catch (error) {
      console.error('Error sharing via email:', error);
      alert('Could not upload invoice. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleReminder = () => {
    // Format phone number
    let phone = currentInvoice.customer_phone.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    
    // Open WhatsApp with reminder message
    const reminderMessage = `Hi! This is a friendly reminder for your pending payment.

${shareMessage}

Please let us know once payment is done. Thank you! 🙏`;
    
    const encodedMessage = encodeURIComponent(reminderMessage);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleDone = () => {
    resetDraft();
    navigate('/dashboard');
  };

  const shareOptions = [
    {
      icon: uploading ? Loader2 : MessageCircle,
      label: 'WhatsApp',
      description: 'Share invoice link',
      color: 'bg-green-500',
      onClick: handleWhatsAppShare,
      shared: shared === 'whatsapp',
      disabled: uploading
    },
    {
      icon: uploading ? Loader2 : Mail,
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
      description: 'Copy invoice details',
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
