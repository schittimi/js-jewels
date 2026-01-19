import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Header from '../../components/ui/Header';
import Card from '../../components/ui/Card';

const History = () => {
  const navigate = useNavigate();
  const { invoices } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filter and search invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customer_phone.includes(searchQuery);
    
    const matchesFilter = 
      filterStatus === 'all' || invoice.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Group by date
  const groupedInvoices = filteredInvoices.reduce((groups, invoice) => {
    const date = new Date(invoice.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(invoice);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Invoice History" showBack />

      {/* Search and Filter */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoices..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {['all', 'paid', 'pending'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${filterStatus === status 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              {status === 'all' ? 'All' : status === 'paid' ? 'Paid' : 'Pending'}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {Object.keys(groupedInvoices).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No invoices found</p>
            <p className="text-sm mt-1">Create your first invoice to get started</p>
          </div>
        ) : (
          Object.entries(groupedInvoices).map(([date, dateInvoices]) => (
            <div key={date} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">{date}</h3>
              <div className="space-y-2">
                {dateInvoices.map((invoice) => (
                  <Card
                    key={invoice.id}
                    hoverable
                    onClick={() => navigate(`/history/${invoice.id}`)}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {invoice.customer_name || invoice.customer_phone}
                          </p>
                          <span className={`
                            text-xs px-2 py-0.5 rounded-full
                            ${invoice.status === 'paid' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-amber-100 text-amber-700'}
                          `}>
                            {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">{invoice.invoice_id}</p>
                          <span className="text-gray-300">•</span>
                          <p className="text-xs text-gray-500">
                            {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ₹{invoice.total.toLocaleString()}
                          </p>
                          {invoice.discount_percent > 0 && (
                            <p className="text-xs text-amber-600">
                              -{invoice.discount_percent}%
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;
