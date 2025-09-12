// CreateInventory.jsx
import React, { useState, useEffect } from "react";
import { Package, Save, AlertCircle, Search, X } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const CreateInventory = () => {
  const [formData, setFormData] = useState({
    assetId: "",
    totalStock: "",
    availableStock: "",
    minimumThreshold: "",
  });

  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [assetSearch, setAssetSearch] = useState("");
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);

  // Fetch all assets on component mount
  useEffect(() => {
    fetchAssets();
  }, []);

  // Filter assets based on search
  useEffect(() => {
    if (assetSearch.trim()) {
      const filtered = assets.filter(asset =>
        asset.assetName.toLowerCase().includes(assetSearch.toLowerCase()) ||
        asset.categoryName.toLowerCase().includes(assetSearch.toLowerCase())
      );
      setFilteredAssets(filtered);
    } else {
      setFilteredAssets(assets);
    }
  }, [assetSearch, assets]);

  const fetchAssets = async () => {
    try {
      setAssetsLoading(true);
      const response = await api.get(`${API_URL}/general/assets`);
      if (response.data) {
        // Flatten category-based assets
        const flattenedAssets = response.data.flatMap(category =>
          category.assets.map(asset => ({
            ...asset,
            categoryName: category.categoryName, // keep reference to category
          }))
        );
        setAssets(flattenedAssets);
        setFilteredAssets(flattenedAssets);
      }
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast.error("Failed to fetch assets");
    } finally {
      setAssetsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'totalStock' || name === 'availableStock') {
      const total = name === 'totalStock' ? parseInt(value) || 0 : parseInt(formData.totalStock) || 0;
      const available = name === 'availableStock' ? parseInt(value) || 0 : parseInt(formData.availableStock) || 0;

      if (total < available) {
        toast.error("Available stock cannot exceed total stock");
      }
    }
  };

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    setFormData(prev => ({
      ...prev,
      assetId: asset._id
    }));
    setAssetSearch(asset.assetName);
    setShowAssetDropdown(false);
  };

  const clearAssetSelection = () => {
    setSelectedAsset(null);
    setFormData(prev => ({
      ...prev,
      assetId: ""
    }));
    setAssetSearch("");
  };

  const validateForm = () => {
    const { assetId, totalStock, availableStock, minimumThreshold } = formData;

    if (!assetId) {
      toast.error("Please select an asset");
      return false;
    }

    if (!totalStock || parseInt(totalStock) <= 0) {
      toast.error("Total stock must be greater than 0");
      return false;
    }

    if (!availableStock || parseInt(availableStock) < 0) {
      toast.error("Available stock must be 0 or greater");
      return false;
    }

    if (parseInt(availableStock) > parseInt(totalStock)) {
      toast.error("Available stock cannot exceed total stock");
      return false;
    }

    if (!minimumThreshold || parseInt(minimumThreshold) < 0) {
      toast.error("Minimum threshold must be 0 or greater");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const response = await api.post(`${API_URL}/inventory/create-inventory`, formData);

      if (response.data.success) {
        toast.success("Inventory created successfully");

        // Reset form
        setFormData({
          assetId: "",
          totalStock: "",
          availableStock: "",
          minimumThreshold: "",
        });
        setSelectedAsset(null);
        setAssetSearch("");
      } else {
        toast.error(response.data.msg || "Failed to create inventory");
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to create inventory");
      console.error("Error creating inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatedIssuedStock = formData.totalStock && formData.availableStock
    ? Math.max(0, parseInt(formData.totalStock) - parseInt(formData.availableStock))
    : 0;

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Package className="w-6 h-6 text-blue-400 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-100">Create Inventory</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Asset Selection */}
            <div className="space-y-2">
              <label htmlFor="assetSearch" className="block text-sm font-medium text-gray-200">
                Select Asset <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      id="assetSearch"
                      value={assetSearch}
                      onChange={(e) => {
                        setAssetSearch(e.target.value);
                        setShowAssetDropdown(true);
                      }}
                      onFocus={() => setShowAssetDropdown(true)}
                      placeholder="Search for an asset..."
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    />
                    <Search className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
                  </div>

                  {selectedAsset && (
                    <button
                      type="button"
                      onClick={clearAssetSelection}
                      className="ml-2 p-3 text-gray-400 hover:text-red-400 transition-colors"
                      title="Clear selection"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Selected Asset Display */}
                {selectedAsset && (
                  <div className="mt-2 bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
                    <p className="font-medium text-blue-200">{selectedAsset.assetName}</p>
                    {selectedAsset.categoryName && (
                      <p className="text-sm text-blue-300">Category: {selectedAsset.categoryName}</p>
                    )}
                  </div>
                )}

                {/* Assets Dropdown */}
                {showAssetDropdown && !selectedAsset && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {assetsLoading ? (
                      <div className="p-4 text-center text-gray-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
                        Loading assets...
                      </div>
                    ) : filteredAssets.length > 0 ? (
                      filteredAssets.map((asset) => (
                        <button
                          key={asset._id}
                          type="button"
                          onClick={() => handleAssetSelect(asset)}
                          className="w-full text-left p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                        >
                          <div className="font-medium text-gray-200">{asset.assetName}</div>
                          {asset.categoryName && (
                            <div className="text-sm text-gray-400">Category: {asset.categoryName}</div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-400">
                        No assets found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stock Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Stock */}
              <div className="space-y-2">
                <label htmlFor="totalStock" className="block text-sm font-medium text-gray-200">
                  Total Stock <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  id="totalStock"
                  name="totalStock"
                  value={formData.totalStock}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Enter total stock quantity"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>

              {/* Available Stock */}
              <div className="space-y-2">
                <label htmlFor="availableStock" className="block text-sm font-medium text-gray-200">
                  Available Stock <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  id="availableStock"
                  name="availableStock"
                  value={formData.availableStock}
                  onChange={handleInputChange}
                  min="0"
                  max={formData.totalStock || undefined}
                  placeholder="Enter available stock"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>

              {/* Minimum Threshold */}
              <div className="space-y-2">
                <label htmlFor="minimumThreshold" className="block text-sm font-medium text-gray-200">
                  Minimum Threshold <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  id="minimumThreshold"
                  name="minimumThreshold"
                  value={formData.minimumThreshold}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="Enter minimum threshold"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
                <p className="text-sm text-gray-400">
                  Alert when stock falls below this level
                </p>
              </div>

              {/* Calculated Issued Stock (Read-only) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">
                  Issued Stock (Calculated)
                </label>
                <input
                  type="number"
                  value={calculatedIssuedStock}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
                />
                <p className="text-sm text-gray-400">
                  Automatically calculated: Total - Available
                </p>
              </div>
            </div>

            {/* Stock Summary */}
            {formData.totalStock && formData.availableStock && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h4 className="font-medium text-gray-200 mb-3">Stock Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-400">{formData.totalStock}</p>
                    <p className="text-sm text-gray-400">Total Stock</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">{formData.availableStock}</p>
                    <p className="text-sm text-gray-400">Available</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-400">{calculatedIssuedStock}</p>
                    <p className="text-sm text-gray-400">Issued</p>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Warnings */}
            {formData.totalStock && formData.availableStock && parseInt(formData.availableStock) > parseInt(formData.totalStock) && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-400 font-medium mb-1">Invalid Stock Configuration</h4>
                  <p className="text-red-300 text-sm">
                    Available stock cannot be greater than total stock.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-700">
              <button
                type="submit"
                disabled={loading || !formData.assetId || parseInt(formData.availableStock) > parseInt(formData.totalStock)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
                  loading || !formData.assetId || parseInt(formData.availableStock) > parseInt(formData.totalStock)
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Inventory
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showAssetDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowAssetDropdown(false)}
        />
      )}
    </div>
  );
};

export default CreateInventory;
