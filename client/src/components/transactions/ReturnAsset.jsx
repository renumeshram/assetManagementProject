import React, { useState, useEffect } from "react";
import { ArrowLeft, Send } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const ReturnAsset = () => {
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    asset: "",
    category: "",
    section: "",
    department: "",
    transactionType: "return",
    quantity: 1,
    returnDate: new Date().toISOString().split("T")[0],
    sapId: "",
    isEwaste: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Load location.json & asset.json
  useEffect(() => {
    fetch("/location.json")
      .then((res) => res.json())
      .then((data) => setLocations(data.locations))
      .catch((err) => console.error("Error loading locations:", err));

    api
      .get("/general/assets")
      .then((res) => {
        setCategories(res.data);
      })
      .catch((err) => console.error("Error loading assets:", err));
  }, []);

  // Derived dropdown data
  const selectedLocation = locations.find(
    (loc) => loc.id.toString() === formData.location
  );
  const selectedDepartment = selectedLocation?.departments.find(
    (dept) => dept.name === formData.department
  );
  const selectedCategory = categories.find(
    (cat) => cat.categoryName === formData.category
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
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
      if (
        !formData.asset ||
        !formData.category ||
        !formData.section ||
        !formData.department ||
        !formData.sapId ||
        !formData.returnDate
      ) {
        setErrors({ general: "All fields are required" });
        toast.error("Please fill in all required fields");
        return;
      }

      if (formData.quantity <= 0) {
        setErrors({ quantity: "Quantity must be greater than 0" });
        toast.error("Quantity must be greater than 0");
        return;
      }

      const response = await api.post(`${API_URL}/transaction/return`, {
        ...formData,
        quantity: Number(formData.quantity),
        returnDate: new Date(formData.returnDate),
      });

      if (response.data.success) {
        toast.success("Asset returned successfully!");
        setFormData({
          asset: "",
          category: "",
          section: "",
          department: "",
          transactionType: "return",
          quantity: 1,
          returnDate: new Date().toISOString().split("T")[0],
          sapId: "",
          isEwaste: false,
        });
        setErrors({});
      }
    } catch (error) {
      console.error("Error returning asset:", error);
      const errorMessage =
        error.response?.data?.msg || "Something went wrong. Try again later.";
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
          <div className="flex items-center mb-6">
            <ArrowLeft className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Return Asset</h3>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location *
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!selectedLocation}
              >
                <option value="">Select Department</option>
                {selectedLocation?.departments.map((dept) => (
                  <option key={dept.name} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Selection */}
            {/* Section Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Section *
              </label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white 
               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!selectedDepartment}
              >
                <option value="">Select Section</option>
                {selectedDepartment?.sections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Asset Category *
              </label>
              <select
                name="category"
                value={formData.category}
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
            </div>

            {/* Asset Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Asset *
              </label>
              <select
                name="asset"
                value={formData.asset}
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
            </div>

            {/* SAP ID */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SAP ID (Returned By) *
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

            {/* Return Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Return Date *
              </label>
              <input
                type="date"
                name="returnDate"
                value={formData.returnDate}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* E-waste Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isEwaste"
                checked={formData.isEwaste}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label className="ml-2 text-sm text-gray-300">
                Mark as E-waste
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Processing..." : "Return Asset"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    asset: "",
                    category: "",
                    section: "",
                    department: "",
                    transactionType: "return",
                    quantity: 1,
                    returnDate: new Date().toISOString().split("T")[0],
                    sapId: "",
                    isEwaste: false,
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

export default ReturnAsset;
