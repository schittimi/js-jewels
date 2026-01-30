import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, Package, Percent } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import BottomSheet from '../../components/ui/BottomSheet';

const AddItems = () => {
  const navigate = useNavigate();
  const { invoiceDraft, productTypes, addItemToDraft, updateItemInDraft, removeItemFromDraft, calculateTotals, calculateItemFinal } = useApp();
  
  const [showTypeSheet, setShowTypeSheet] = useState(false);
  const [currentItem, setCurrentItem] = useState({ type: '', value: '', qty: 1, discount_percent: 10 });
  const [editingItemId, setEditingItemId] = useState(null);
  const [errors, setErrors] = useState({});

  const items = invoiceDraft.items || [];
  const { subtotal, discountAmount, total } = calculateTotals(items);

  const handleSelectType = (type) => {
    setCurrentItem(prev => ({ ...prev, type: type.name }));
    setShowTypeSheet(false);
  };

  const handleAddItem = () => {
    // Validate
    const newErrors = {};
    if (!currentItem.type) newErrors.type = 'Select a type';
    if (!currentItem.value || currentItem.value <= 0) newErrors.value = 'Enter valid amount';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingItemId) {
      updateItemInDraft(editingItemId, {
        type: currentItem.type,
        value: Number(currentItem.value),
        qty: Number(currentItem.qty) || 1,
        discount_percent: Number(currentItem.discount_percent) || 0
      });
      setEditingItemId(null);
    } else {
      addItemToDraft({
        type: currentItem.type,
        value: Number(currentItem.value),
        qty: Number(currentItem.qty) || 1,
        discount_percent: Number(currentItem.discount_percent) || 0
      });
    }

    setCurrentItem({ type: '', value: '', qty: 1, discount_percent: 10 });
    setErrors({});
  };

  const handleEditItem = (item) => {
    setCurrentItem({
      type: item.type,
      value: item.value.toString(),
      qty: item.qty,
      discount_percent: item.discount_percent || 0
    });
    setEditingItemId(item.id);
  };

  const handleCancelEdit = () => {
    setCurrentItem({ type: '', value: '', qty: 1, discount_percent: 10 });
    setEditingItemId(null);
    setErrors({});
  };

  const handleContinue = () => {
    if (items.length === 0) {
      setErrors({ items: 'Add at least one item' });
      return;
    }
    navigate('/invoice/review');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Add Items" showBack showHome />

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-1 rounded-full bg-primary-600" />
          <div className="flex-1 h-1 rounded-full bg-primary-600" />
          <div className="flex-1 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Add Item Form */}
        <Card className="p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            {editingItemId ? 'Edit Item' : 'Add New Item'}
          </h3>
          
          {/* Product Type Selector */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Type
            </label>
            <button
              type="button"
              onClick={() => setShowTypeSheet(true)}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-xl border
                ${errors.type ? 'border-red-300' : 'border-gray-300'}
                bg-white text-left
              `}
            >
              <span className={currentItem.type ? 'text-gray-900' : 'text-gray-400'}>
                {currentItem.type || 'Select type'}
              </span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          {/* Value and Qty */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={currentItem.value}
                onChange={(e) => {
                  setCurrentItem(prev => ({ ...prev, value: e.target.value }));
                  if (errors.value) setErrors(prev => ({ ...prev, value: '' }));
                }}
                placeholder="0"
                className={`
                  w-full px-4 py-3 rounded-xl border
                  ${errors.value ? 'border-red-300' : 'border-gray-300'}
                  focus:border-primary-500 focus:ring-primary-500
                `}
              />
              {errors.value && (
                <p className="mt-1 text-sm text-red-600">{errors.value}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qty
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={currentItem.qty}
                onChange={(e) => setCurrentItem(prev => ({ 
                  ...prev, 
                  qty: Math.max(1, parseInt(e.target.value) || 1)
                }))}
                min="1"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Disc %
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={currentItem.discount_percent}
                onChange={(e) => setCurrentItem(prev => ({ 
                  ...prev, 
                  discount_percent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                }))}
                min="0"
                max="100"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {editingItemId && (
              <Button variant="secondary" onClick={handleCancelEdit} className="flex-1">
                Cancel
              </Button>
            )}
            <Button onClick={handleAddItem} className="flex-1">
              <Plus className="w-4 h-4 mr-1" />
              {editingItemId ? 'Update' : 'Add Item'}
            </Button>
          </div>
        </Card>

        {/* Items List */}
        {items.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Items ({items.length})
            </h3>
            <div className="space-y-2">
              {items.map((item) => {
                const itemTotal = item.value * item.qty;
                const itemDiscount = item.discount_percent ? Math.round(itemTotal * (item.discount_percent / 100)) : 0;
                const itemFinal = itemTotal - itemDiscount;
                
                return (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleEditItem(item)}
                      >
                        <p className="font-medium text-gray-900">{item.type}</p>
                        <p className="text-sm text-gray-500">
                          ₹{item.value.toLocaleString()} × {item.qty}
                          {item.discount_percent > 0 && (
                            <span className="text-amber-600 ml-2">(-{item.discount_percent}%)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          {item.discount_percent > 0 && (
                            <p className="text-xs text-gray-400 line-through">
                              ₹{itemTotal.toLocaleString()}
                            </p>
                          )}
                          <p className="font-semibold text-gray-900">
                            ₹{itemFinal.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItemFromDraft(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Totals */}
            <div className="mt-4 p-4 bg-gray-100 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-amber-600">
                  <span>Total Discount</span>
                  <span>- ₹{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  ₹{total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No items added yet</p>
            <p className="text-sm">Add items to create invoice</p>
          </div>
        )}

        {errors.items && (
          <p className="text-center text-sm text-red-600 mt-2">{errors.items}</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 safe-area-bottom">
        <Button 
          fullWidth 
          size="lg" 
          onClick={handleContinue}
          disabled={items.length === 0}
        >
          Review Invoice
        </Button>
      </div>

      {/* Product Type Bottom Sheet */}
      <BottomSheet
        isOpen={showTypeSheet}
        onClose={() => setShowTypeSheet(false)}
        title="Select Product Type"
      >
        <div className="space-y-2">
          {productTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleSelectType(type)}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">{type.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button 
            variant="ghost" 
            fullWidth
            onClick={() => {
              setShowTypeSheet(false);
              navigate('/products');
            }}
          >
            Manage Product Types
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
};

export default AddItems;
