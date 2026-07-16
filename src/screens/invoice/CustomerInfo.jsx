import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Contact } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

// Contact Picker API is only available on Android Chrome/Edge (secure context).
// Not supported on iOS Safari or desktop browsers - manual entry is the fallback everywhere.
const isContactPickerSupported = () =>
  typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;

const CustomerInfo = () => {
  const navigate = useNavigate();
  const { invoiceDraft, updateDraft } = useApp();
  
  const [formData, setFormData] = useState({
    customer_name: invoiceDraft.customer_name || '',
    customer_phone: invoiceDraft.customer_phone || '',
    customer_address: invoiceDraft.customer_address || ''
  });
  const [errors, setErrors] = useState({});
  const [contactPickerSupported] = useState(isContactPickerSupported);
  const [pickingContact, setPickingContact] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Phone is required
    const cleanPhone = formData.customer_phone.replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.customer_phone = 'Phone number is required';
    } else if (cleanPhone.length !== 10) {
      newErrors.customer_phone = 'Enter a valid 10-digit number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    updateDraft({
      customer_name: formData.customer_name.trim(),
      customer_phone: formData.customer_phone.replace(/\D/g, ''),
      customer_address: formData.customer_address.trim()
    });

    navigate('/invoice/items');
  };

  const handlePickContact = async () => {
    try {
      setPickingContact(true);
      const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
      if (!contacts.length) return;

      const contact = contacts[0];
      const rawPhone = contact.tel?.[0] || '';
      // Keep only the last 10 digits in case the contact has a country code prefix
      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
      const name = contact.name?.[0] || '';

      setFormData(prev => ({
        ...prev,
        customer_phone: cleanPhone || prev.customer_phone,
        customer_name: prev.customer_name || name
      }));
      if (errors.customer_phone) {
        setErrors(prev => ({ ...prev, customer_phone: '' }));
      }
    } catch (error) {
      // User cancelled the picker or permission was denied - safe to ignore
      console.warn('Contact picker cancelled or failed:', error);
    } finally {
      setPickingContact(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header title="Customer Details" showBack showHome />

      <div className="flex-1 px-4 py-6">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1 rounded-full bg-primary-600" />
          <div className="flex-1 h-1 rounded-full bg-gray-200" />
          <div className="flex-1 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="space-y-5">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => handleChange('customer_name', e.target.value)}
                placeholder="Enter customer name"
                className="block w-full rounded-xl border border-gray-300 pl-12 pr-4 py-3.5 text-base focus:border-primary-500 focus:ring-primary-500 transition-colors"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              {contactPickerSupported && (
                <button
                  type="button"
                  onClick={handlePickContact}
                  disabled={pickingContact}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                >
                  <Contact className="w-4 h-4" />
                  {pickingContact ? 'Opening...' : 'Pick from Contacts'}
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => handleChange('customer_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                className={`
                  block w-full rounded-xl border pl-12 pr-4 py-3.5 text-base 
                  focus:ring-primary-500 transition-colors
                  ${errors.customer_phone 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-300 focus:border-primary-500'}
                `}
              />
            </div>
            {errors.customer_phone && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_phone}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <div className="relative">
              <div className="absolute top-3.5 left-4 pointer-events-none">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <textarea
                value={formData.customer_address}
                onChange={(e) => handleChange('customer_address', e.target.value)}
                placeholder="Enter delivery address (optional)"
                rows={3}
                className="block w-full rounded-xl border border-gray-300 pl-12 pr-4 py-3.5 text-base focus:border-primary-500 focus:ring-primary-500 transition-colors resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 safe-area-bottom">
        <Button fullWidth size="lg" onClick={handleContinue}>
          Continue to Items
        </Button>
      </div>
    </div>
  );
};

export default CustomerInfo;
