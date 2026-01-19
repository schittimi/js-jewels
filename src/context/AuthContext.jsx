import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signOut 
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Setup reCAPTCHA
  const setupRecaptcha = (elementId) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          window.recaptchaVerifier = null;
        }
      });
    }
    return window.recaptchaVerifier;
  };

  // Send OTP
  const sendOTP = async (phone) => {
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      setPhoneNumber(formattedPhone);
      
      const recaptchaVerifier = setupRecaptcha('recaptcha-container');
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(result);
      return { success: true };
    } catch (error) {
      console.error('Error sending OTP:', error);
      // Reset reCAPTCHA on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      return { success: false, error: error.message };
    }
  };

  // Verify OTP
  const verifyOTP = async (otp) => {
    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result. Please request OTP again.');
      }
      const result = await confirmationResult.confirm(otp);
      setUser(result.user);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setConfirmationResult(null);
      return { success: true };
    } catch (error) {
      console.error('Error logging out:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    phoneNumber,
    sendOTP,
    verifyOTP,
    logout,
    confirmationResult
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
