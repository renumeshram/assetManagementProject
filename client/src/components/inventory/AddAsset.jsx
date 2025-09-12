import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../utils/api";

const AddAsset = () => {
  const [form, setForm] = useState({
    assetName: "",
    categoryName: "",
    make: "",
    model: "",
    unitWeight: "",
    isEwaste: false,
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // ✅ fetch categories
  useEffect(() => {
    api
      .get("/general/assets") // 👈 adjust to your backend route for fetching categories
      .then((res) => {
        setCategories(res.data);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await api.post("/general/inventory/add-asset", {
        assetName: form.assetName,
        categoryName: form.categoryName,
        make: form.make,
        model: form.model,
        unitWeight: parseFloat(form.unitWeight),
        isEwaste: form.isEwaste,
        description: form.description,
      });

      if (res.data.success) {
        toast.success(res.data.msg || "Asset added successfully!");
        navigate("/assets"); // redirect to asset list page
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Error adding asset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white rounded-xl shadow-lg border border-gray-700 p-6 max-w-xl mx-auto">
      <h3 className="text-xl font-semibold mb-6">Add New Asset</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Category Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Category
          </label>
          <select
            name="categoryName"
            value={form.categoryName}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.categoryName}>
                {cat.categoryName}
              </option>
            ))}
          </select>
        </div>

        {/* Asset Name */}
        <div>
          <label className="block text-sm mb-1">Asset Name</label>
          <input
            type="text"
            name="assetName"
            value={form.assetName}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
            required
          />
        </div>

        {/* Make & Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Make</label>
            <input
              type="text"
              name="make"
              value={form.make}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Model</label>
            <input
              type="text"
              name="model"
              value={form.model}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
              required
            />
          </div>
        </div>

        {/* Unit Weight */}
        <div>
          <label className="block text-sm mb-1">Unit Weight (in Kilograms)</label>
          <input
            type="number"
            name="unitWeight"
            value={form.unitWeight}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
            required
          />
        </div>

        {/* E-Waste Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isEwaste"
            checked={form.isEwaste}
            onChange={handleChange}
            className="h-4 w-4"
          />
          <label className="text-sm">Mark as E-Waste</label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm mb-1">Description</label>
          <input
            type="textarea"
            name="description"
            value={form.description}
            onChange={handleChange}
            maxLength={200}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md"
            
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md text-white font-medium"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/assets")}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAsset;
