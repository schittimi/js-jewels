import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const Header = ({ title, showBack = false, showHome = false, onBack, rightAction }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleHome = () => {
    navigate('/dashboard');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          {rightAction}
          {showHome && (
            <button
              onClick={handleHome}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Home className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
