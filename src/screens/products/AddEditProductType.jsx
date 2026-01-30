import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';

const AddEditProductType = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { productTypes, addProductType, updateProductType } = useApp();
  
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) {
      const type = productTypes.find(t => t.id === id);
      if (type) {
        setName(type.name);
      } else {
        navigate('/products');
      }
    }
  }, [id, productTypes, isEditing, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    
    // Validation
    if (!trimmedName) {
      setError('Please enter a product type name');
      return;
    }

    // Check for duplicates
    const isDuplicate = productTypes.some(
      t => t.name.toLowerCase() === trimmedName.toLowerCase() && t.id !== id
    );
    
    if (isDuplicate) {
      setError('This product type already exists');
      return;
    }

    if (isEditing) {
      updateProductType(id, trimmedName);
    } else {
      addProductType(trimmedName);
    }

    navigate('/products');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header 
        title={isEditing ? 'Edit Product Type' : 'Add Product Type'} 
        showBack
        showHome
      />

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 px-4 py-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Ear Ring, Necklace"
              className={`
                w-full px-4 py-3.5 rounded-xl border
                ${error ? 'border-red-300' : 'border-gray-300'}
                focus:border-primary-500 focus:ring-primary-500 transition-colors
              `}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Product types are used to categorize items in your invoices. 
            Examples: Ear Ring, Necklace, Bracelet, Ring, Bangle, Pendant
          </p>
        </div>

        <div className="px-4 py-4 border-t border-gray-100 safe-area-bottom">
          <Button type="submit" fullWidth size="lg">
            {isEditing ? 'Update' : 'Add'} Product Type
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddEditProductType;
