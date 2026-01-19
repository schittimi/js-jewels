import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth screens
import Login from './screens/auth/Login';
import OTPVerification from './screens/auth/OTPVerification';

// Main screens
import Dashboard from './screens/Dashboard';
import CustomerInfo from './screens/invoice/CustomerInfo';
import AddItems from './screens/invoice/AddItems';
import ReviewInvoice from './screens/invoice/ReviewInvoice';
import PaymentStatus from './screens/invoice/PaymentStatus';
import PDFViewer from './screens/invoice/PDFViewer';
import ShareInvoice from './screens/invoice/ShareInvoice';

// History
import History from './screens/history/History';
import InvoiceDetails from './screens/history/InvoiceDetails';

// Product Types
import ProductTypes from './screens/products/ProductTypes';
import AddEditProductType from './screens/products/AddEditProductType';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route wrapper (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/otp" element={<PublicRoute><OTPVerification /></PublicRoute>} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* Invoice Creation Flow */}
        <Route path="/invoice/customer" element={<ProtectedRoute><CustomerInfo /></ProtectedRoute>} />
        <Route path="/invoice/items" element={<ProtectedRoute><AddItems /></ProtectedRoute>} />
        <Route path="/invoice/review" element={<ProtectedRoute><ReviewInvoice /></ProtectedRoute>} />
        <Route path="/invoice/payment" element={<ProtectedRoute><PaymentStatus /></ProtectedRoute>} />
        <Route path="/invoice/pdf" element={<ProtectedRoute><PDFViewer /></ProtectedRoute>} />
        <Route path="/invoice/share" element={<ProtectedRoute><ShareInvoice /></ProtectedRoute>} />
        
        {/* History */}
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/history/:id" element={<ProtectedRoute><InvoiceDetails /></ProtectedRoute>} />
        
        {/* Product Types */}
        <Route path="/products" element={<ProtectedRoute><ProductTypes /></ProtectedRoute>} />
        <Route path="/products/add" element={<ProtectedRoute><AddEditProductType /></ProtectedRoute>} />
        <Route path="/products/edit/:id" element={<ProtectedRoute><AddEditProductType /></ProtectedRoute>} />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
