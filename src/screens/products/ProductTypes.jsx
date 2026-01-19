import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import BottomSheet from '../../components/ui/BottomSheet';

const ProductTypes = () => {
  const navigate = useNavigate();
  const { productTypes, deleteProductType } = useApp();
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteProductType(deleteId);
    }
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        title="Product Types" 
        showBack
        rightAction={
          <button
            onClick={() => navigate('/products/add')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-5 h-5 text-primary-600" />
          </button>
        }
      />

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {productTypes.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">No Product Types</p>
            <p className="text-gray-500 mt-1">Add your first product type to get started</p>
            <Button onClick={() => navigate('/products/add')} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Product Type
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {productTypes.map((type) => (
              <Card key={type.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary-600" />
                    </div>
                    <span className="font-medium text-gray-900">{type.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/products/edit/${type.id}`)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(type.id)}
                      className="p-2 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Button (floating) */}
      {productTypes.length > 0 && (
        <div className="px-4 py-4 bg-white border-t border-gray-100 safe-area-bottom">
          <Button fullWidth onClick={() => navigate('/products/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product Type
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <BottomSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Product Type?"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this product type? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
};

export default ProductTypes;
