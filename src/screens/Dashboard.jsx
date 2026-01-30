import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  History, 
  Package, 
  BarChart3, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import Logo from '../components/Logo';
import Card from '../components/ui/Card';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { invoices, resetDraft } = useApp();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNewInvoice = () => {
    resetDraft();
    navigate('/invoice/customer');
  };

  // Quick stats
  const todayInvoices = invoices.filter(inv => {
    const today = new Date().toDateString();
    return new Date(inv.created_at).toDateString() === today;
  });

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');

  const menuItems = [
    {
      icon: PlusCircle,
      label: 'New Invoice',
      description: 'Create a new bill',
      color: 'bg-primary-500',
      onClick: handleNewInvoice
    },
    {
      icon: History,
      label: 'Invoice History',
      description: `${invoices.length} total invoices`,
      color: 'bg-emerald-500',
      onClick: () => navigate('/history')
    },
    {
      icon: Package,
      label: 'Product Types',
      description: 'Manage categories',
      color: 'bg-amber-500',
      onClick: () => navigate('/products')
    },
    {
      icon: BarChart3,
      label: 'Sales Reports',
      description: 'View sales analytics',
      color: 'bg-purple-500',
      onClick: () => navigate('/reports')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="tile" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">JS Fashion</h1>
              <p className="text-xs text-gray-500">Jewellery Billing</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Today's Sales</p>
            <p className="text-2xl font-bold text-gray-900">{todayInvoices.length}</p>
            <p className="text-xs text-gray-400">invoices</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{pendingInvoices.length}</p>
            <p className="text-xs text-gray-400">unpaid</p>
          </Card>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 pb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <Card 
              key={index} 
              hoverable={!item.disabled}
              onClick={item.disabled ? undefined : item.onClick}
              className={`p-4 ${item.disabled ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.label}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                {!item.disabled && (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {invoices.length > 0 && (
        <div className="px-4 pb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Recent Invoices
            </h2>
            <button 
              onClick={() => navigate('/history')}
              className="text-sm text-primary-600 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-2">
            {invoices.slice(0, 3).map((invoice) => (
              <Card 
                key={invoice.id}
                hoverable
                onClick={() => navigate(`/history/${invoice.id}`)}
                className="p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {invoice.customer_name || invoice.customer_phone}
                    </p>
                    <p className="text-xs text-gray-500">{invoice.invoice_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{invoice.total.toLocaleString()}</p>
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'}
                    `}>
                      {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
