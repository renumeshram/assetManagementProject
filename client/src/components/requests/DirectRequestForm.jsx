import React, { useState, useEffect } from "react";
import { Send } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

const DirectRequestForm = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    sapId: "",
    userName: "",
    assetName: "",
    categoryName: "",
    quantity: 1,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Load asset categories
  useEffect(() => {
    api.get("/general/assets")
      .then((res) => { setCategories(res.data) })
      .catch((err) => console.error("Error loading assets:", err));
  }, []);

  // Derived dropdown data
  const selectedCategory = categories.find(
    (cat) => cat.categoryName === formData.categoryName
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Basic validation
      if (!formData.sapId || !formData.userName || !formData.assetName || 
          !formData.categoryName || !formData.quantity) {
        setErrors({ general: "All fields are required" });
        toast.error("Please fill in all required fields");
        return;
      }

      if (formData.quantity <= 0) {
        setErrors({ quantity: "Quantity must be greater than 0" });
        toast.error("Quantity must be greater than 0");
        return;
      }

      const response = await api.post("/request/direct", {
        sapId: formData.sapId,
        userName: formData.userName,
        assetName: formData.assetName,
        categoryName: formData.categoryName,
        quantity: Number(formData.quantity),
      });

      if (response.data.success) {
        toast.success("Direct request created successfully!");
        setFormData({
          sapId: "",
          userName: "",
          assetName: "",
          categoryName: "",
          quantity: 1,
        });
        setErrors({});
      }
    } catch (error) {
      console.error("Error creating direct request:", error);
      const errorMessage = error.response?.data?.msg || "Something went wrong. Try again later.";
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900/90 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-6">
            Direct Asset Request
          </h3>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SAP ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SAP ID *
              </label>
              <input
                type="text"
                name="sapId"
                value={formData.sapId}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter SAP ID"
                required
              />
              {errors.sapId && (
                <p className="mt-1 text-sm text-red-400">{errors.sapId}</p>
              )}
            </div>

            {/* User Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                User Name *
              </label>
              <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter user name"
                required
              />
              {errors.userName && (
                <p className="mt-1 text-sm text-red-400">{errors.userName}</p>
              )}
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Asset Category *
              </label>
              <select
                name="categoryName"
                value={formData.categoryName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.categoryName}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
              {errors.categoryName && (
                <p className="mt-1 text-sm text-red-400">{errors.categoryName}</p>
              )}
            </div>

            {/* Asset Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Asset *
              </label>
              <select
                name="assetName"
                value={formData.assetName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!selectedCategory}
              >
                <option value="">Select Asset</option>
                {selectedCategory?.assets?.map((asset) => (
                  <option key={asset._id} value={asset.assetName}>
                    {asset.assetName}
                  </option>
                ))}
              </select>
              {errors.assetName && (
                <p className="mt-1 text-sm text-red-400">{errors.assetName}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-400">{errors.quantity}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Processing..." : "Create Direct Request"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    sapId: "",
                    userName: "",
                    assetName: "",
                    categoryName: "",
                    quantity: 1,
                  })
                }
                className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectRequestForm;

