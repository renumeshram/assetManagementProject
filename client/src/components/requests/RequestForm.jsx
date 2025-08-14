import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { requestSchema } from '../../schemas/requestSchemas';
import { mockCategories, mockAssets } from '../../data/mockData';

const RequestForm = ({ isDirect = false }) => {
  const [formData, setFormData] = useState({
    categoryId: '',
    assetId: '',
    quantity: 1,
    comments: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      requestSchema.parse({...formData, quantity: Number(formData.quantity)});
      setSuccess(true);
      setFormData({ categoryId: '', assetId: '', quantity: 1, comments: '' });
      setErrors({});
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach(err => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            {isDirect ? 'Direct Asset Request' : 'Request New Asset'}
          </h3>
          
          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg">
              <p className="text-green-800">Request submitted successfully!</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({...formData, categoryId: e.target.value, assetId: ''})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {mockCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset
                </label>
                <select
                  value={formData.assetId}
                  onChange={(e) => setFormData({...formData, assetId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!formData.categoryId}
                >
                  <option value="">Select Asset</option>
                  {mockAssets.filter(asset => asset.categoryId === formData.categoryId).map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
                {errors.assetId && <p className="text-red-500 text-sm mt-1">{errors.assetId}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({...formData, comments: e.target.value})}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any additional information..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </button>
              <button
                onClick={() => setFormData({ categoryId: '', assetId: '', quantity: 1, comments: '' })}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestForm;