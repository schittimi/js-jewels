import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Login = () => {
  const navigate = useNavigate();
  const { sendOTP } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate phone
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    
    const result = await sendOTP(cleanPhone);
    
    if (result.success) {
      navigate('/otp', { state: { phone: cleanPhone } });
    } else {
      setError(result.error || 'Failed to send OTP. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Logo/Title */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <span className="text-white text-2xl font-bold font-serif">JS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">JS Fashion Jewellery</h1>
          <p className="text-gray-500 mt-2">Billing App</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">+91</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit number"
                className="block w-full rounded-xl border border-gray-300 pl-14 pr-4 py-3.5 text-base focus:border-primary-500 focus:ring-primary-500 transition-colors"
                autoComplete="tel"
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            disabled={phone.length !== 10}
          >
            <Phone className="w-5 h-5 mr-2" />
            Send OTP
          </Button>
        </form>

        {/* reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-gray-400">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
};

export default Login;
