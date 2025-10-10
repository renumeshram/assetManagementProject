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
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const navigate = useNavigate();

  // Fetch categories
  const fetchCategories = () => {
    api
      .get("/general/assets")
      .then((res) => {
        setCategories(res.data);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setAddingCategory(true);
      const res = await api.post("/general/assets-category", {
        categoryName: newCategory.trim(),
      });

      if (res.data.success) {
        toast.success(res.data.msg || "Category added successfully!");
        setNewCategory("");
        setShowAddCategory(false);
        fetchCategories(); // Refresh categories
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error adding category");
    } finally {
      setAddingCategory(false);
    }
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
        navigate("/assets");
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

      {/* Add Category Section */}
      <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-300">Manage Categories</h4>
          <button
            type="button"
            onClick={() => setShowAddCategory(!showAddCategory)}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors cursor-pointer"
          >
            {showAddCategory ? "Cancel" : "+ Add Category"}
          </button>
        </div>

        {showAddCategory && (
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={addingCategory}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md text-white text-sm font-medium transition-colors cursor-pointer"
            >
              {addingCategory ? "Adding..." : "Add"}
            </button>
          </form>
        )}
      </div>

      {/* Asset Form */}
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
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="h-4 w-4 rounded bg-gray-800 border-gray-600"
          />
          <label className="text-sm">Mark as E-Waste</label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            maxLength={200}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md text-white font-medium transition-colors cursor-pointer"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/assets")}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAsset;