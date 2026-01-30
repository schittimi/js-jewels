import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  Share2, 
  Filter, 
  ChevronDown, 
  Calendar,
  ArrowUpDown,
  X,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import BottomSheet from '../../components/ui/BottomSheet';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper to format date for input
const formatDateForInput = (date) => {
  return date.toISOString().split('T')[0];
};

// Get date range for last N days
const getLastNDays = (n) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - n);
  return { start, end };
};

const SalesReports = () => {
  const navigate = useNavigate();
  const { invoices } = useApp();
  
  // Default to last 7 days
  const defaultRange = getLastNDays(7);
  
  // Filter states
  const [startDate, setStartDate] = useState(formatDateForInput(defaultRange.start));
  const [endDate, setEndDate] = useState(formatDateForInput(defaultRange.end));
  const [statusFilter, setStatusFilter] = useState('all'); // all, paid, pending
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, amount_desc, amount_asc
  
  // Bottom sheet states
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showDateRangeSheet, setShowDateRangeSheet] = useState(false);

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoices.filter(inv => {
      const invDate = new Date(inv.created_at);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include entire end day
      
      // Date filter
      if (invDate < start || invDate > end) return false;
      
      // Status filter
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      
      return true;
    });
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return b.created_at - a.created_at;
        case 'date_asc':
          return a.created_at - b.created_at;
        case 'amount_desc':
          return b.total - a.total;
        case 'amount_asc':
          return a.total - b.total;
        default:
          return b.created_at - a.created_at;
      }
    });
    
    return filtered;
  }, [invoices, startDate, endDate, statusFilter, sortBy]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
    const totalPending = filteredInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.total, 0);
    const paidCount = filteredInvoices.filter(inv => inv.status === 'paid').length;
    const pendingCount = filteredInvoices.filter(inv => inv.status === 'pending').length;
    
    return {
      totalSales,
      totalPaid,
      totalPending,
      totalInvoices: filteredInvoices.length,
      paidCount,
      pendingCount
    };
  }, [filteredInvoices]);

  // Quick date range presets
  const applyDatePreset = (preset) => {
    let range;
    switch (preset) {
      case 'today':
        range = getLastNDays(0);
        break;
      case 'week':
        range = getLastNDays(7);
        break;
      case 'month':
        range = getLastNDays(30);
        break;
      case 'quarter':
        range = getLastNDays(90);
        break;
      default:
        range = getLastNDays(7);
    }
    setStartDate(formatDateForInput(range.start));
    setEndDate(formatDateForInput(range.end));
    setShowDateRangeSheet(false);
  };

  // Generate PDF Report
  const generateReportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Colors
    const maroon = [163, 52, 93];
    const darkText = [30, 30, 30];
    const lightText = [120, 120, 120];

    // Header
    doc.setFillColor(...maroon);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('JS Fashion Jewellery', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Sales Report', pageWidth / 2, 25, { align: 'center' });

    // Report period
    let y = 45;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...lightText);
    
    const periodText = `Period: ${new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    doc.text(periodText, margin, y);
    
    const statusText = `Status: ${statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`;
    doc.text(statusText, pageWidth - margin, y, { align: 'right' });

    // Summary Cards
    y += 15;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 30, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkText);

    const colWidth = (pageWidth - 2 * margin) / 3;
    
    // Total Sales
    doc.text('Total Sales', margin + colWidth / 2, y + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(...maroon);
    doc.text(`Rs.${summary.totalSales.toLocaleString()}`, margin + colWidth / 2, y + 22, { align: 'center' });

    // Paid
    doc.setFontSize(11);
    doc.setTextColor(...darkText);
    doc.text('Paid', margin + colWidth + colWidth / 2, y + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(34, 139, 34);
    doc.text(`Rs.${summary.totalPaid.toLocaleString()}`, margin + colWidth + colWidth / 2, y + 22, { align: 'center' });

    // Pending
    doc.setFontSize(11);
    doc.setTextColor(...darkText);
    doc.text('Pending', margin + 2 * colWidth + colWidth / 2, y + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(180, 120, 0);
    doc.text(`Rs.${summary.totalPending.toLocaleString()}`, margin + 2 * colWidth + colWidth / 2, y + 22, { align: 'center' });

    // Invoice count
    y += 40;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...lightText);
    doc.text(`Total Invoices: ${summary.totalInvoices} (${summary.paidCount} paid, ${summary.pendingCount} pending)`, margin, y);

    // Table
    y += 10;

    const tableData = filteredInvoices.map(inv => [
      inv.invoice_id,
      new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      inv.customer_name || inv.customer_phone,
      inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
      `Rs.${inv.total.toLocaleString()}`
    ]);

    doc.autoTable({
      startY: y,
      head: [['Invoice', 'Date', 'Customer', 'Status', 'Amount']],
      body: tableData,
      theme: 'striped',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
        textColor: darkText,
      },
      headStyles: {
        fillColor: maroon,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 50 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setTextColor(...lightText);
    doc.text(
      `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    return doc;
  };

  const handleDownload = () => {
    const pdf = generateReportPDF();
    const filename = `SalesReport_${startDate}_to_${endDate}.pdf`;
    pdf.save(filename);
  };

  const handleShare = async () => {
    try {
      const pdf = generateReportPDF();
      const blob = pdf.output('blob');
      const filename = `SalesReport_${startDate}_to_${endDate}.pdf`;
      const file = new File([blob], filename, { type: 'application/pdf' });

      const shareMessage = `JS Fashion Jewellery - Sales Report
Period: ${new Date(startDate).toLocaleDateString('en-IN')} to ${new Date(endDate).toLocaleDateString('en-IN')}
Total Sales: ₹${summary.totalSales.toLocaleString()}
Invoices: ${summary.totalInvoices}`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Sales Report',
          text: shareMessage
        });
      } else {
        // Fallback - just download
        pdf.save(filename);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'date_desc': return 'Newest First';
      case 'date_asc': return 'Oldest First';
      case 'amount_desc': return 'Highest Amount';
      case 'amount_asc': return 'Lowest Amount';
      default: return 'Sort';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Sales Reports" showBack showHome />

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Filter Bar */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setShowDateRangeSheet(true)}
            className="flex items-center gap-1 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            <Calendar className="w-4 h-4" />
            {new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </button>
          
          <button
            onClick={() => setShowFilterSheet(true)}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-sm font-medium whitespace-nowrap ${
              statusFilter !== 'all' ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            {statusFilter === 'all' ? 'Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
          </button>
          
          <button
            onClick={() => setShowSortSheet(true)}
            className="flex items-center gap-1 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 whitespace-nowrap"
          >
            <ArrowUpDown className="w-4 h-4" />
            {getSortLabel()}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className="p-3 text-center">
            <p className="text-xs text-gray-500">Total Sales</p>
            <p className="text-lg font-bold text-primary-600">₹{summary.totalSales.toLocaleString()}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-gray-500">Paid</p>
            <p className="text-lg font-bold text-green-600">₹{summary.totalPaid.toLocaleString()}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-lg font-bold text-amber-600">₹{summary.totalPending.toLocaleString()}</p>
          </Card>
        </div>

        {/* Invoice Count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            {summary.totalInvoices} invoices ({summary.paidCount} paid, {summary.pendingCount} pending)
          </p>
        </div>

        {/* Invoice List */}
        {filteredInvoices.length > 0 ? (
          <div className="space-y-2">
            {filteredInvoices.map((invoice) => (
              <Card 
                key={invoice.id}
                hoverable
                onClick={() => navigate(`/history/${invoice.id}`)}
                className="p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {invoice.customer_name || invoice.customer_phone}
                      </p>
                      <span className={`
                        text-xs px-2 py-0.5 rounded-full flex-shrink-0
                        ${invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'}
                      `}>
                        {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {invoice.invoice_id} • {new Date(invoice.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900 ml-3">
                    ₹{invoice.total.toLocaleString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No invoices found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
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

      {/* Date Range Sheet */}
      <BottomSheet
        isOpen={showDateRangeSheet}
        onClose={() => setShowDateRangeSheet(false)}
        title="Select Date Range"
      >
        <div className="space-y-4">
          {/* Quick Presets */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => applyDatePreset('today')}
              className="p-3 text-left rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <p className="font-medium text-gray-900">Today</p>
            </button>
            <button
              onClick={() => applyDatePreset('week')}
              className="p-3 text-left rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <p className="font-medium text-gray-900">Last 7 Days</p>
            </button>
            <button
              onClick={() => applyDatePreset('month')}
              className="p-3 text-left rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <p className="font-medium text-gray-900">Last 30 Days</p>
            </button>
            <button
              onClick={() => applyDatePreset('quarter')}
              className="p-3 text-left rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <p className="font-medium text-gray-900">Last 90 Days</p>
            </button>
          </div>

          {/* Custom Range */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Custom Range</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
                />
              </div>
            </div>
          </div>

          <Button fullWidth onClick={() => setShowDateRangeSheet(false)}>
            Apply
          </Button>
        </div>
      </BottomSheet>

      {/* Status Filter Sheet */}
      <BottomSheet
        isOpen={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        title="Filter by Status"
      >
        <div className="space-y-2">
          {[
            { value: 'all', label: 'All Invoices' },
            { value: 'paid', label: 'Paid Only' },
            { value: 'pending', label: 'Pending Only' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setStatusFilter(option.value);
                setShowFilterSheet(false);
              }}
              className={`
                w-full p-4 text-left rounded-xl transition-colors
                ${statusFilter === option.value 
                  ? 'bg-primary-50 border-2 border-primary-500' 
                  : 'bg-gray-50 hover:bg-gray-100'}
              `}
            >
              <p className="font-medium text-gray-900">{option.label}</p>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Sort Sheet */}
      <BottomSheet
        isOpen={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        title="Sort By"
      >
        <div className="space-y-2">
          {[
            { value: 'date_desc', label: 'Newest First' },
            { value: 'date_asc', label: 'Oldest First' },
            { value: 'amount_desc', label: 'Highest Amount' },
            { value: 'amount_asc', label: 'Lowest Amount' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setSortBy(option.value);
                setShowSortSheet(false);
              }}
              className={`
                w-full p-4 text-left rounded-xl transition-colors
                ${sortBy === option.value 
                  ? 'bg-primary-50 border-2 border-primary-500' 
                  : 'bg-gray-50 hover:bg-gray-100'}
              `}
            >
              <p className="font-medium text-gray-900">{option.label}</p>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};

export default SalesReports;
