import React, { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { requestSchema } from "../../schemas/requestSchemas";
import api from "../../utils/api";
import { z } from "zod";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RequestForm = ({ isDirect = false }) => {
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    location: "",
    department: "",
    section: "",
    category: "",
    asset: "",
    quantity: 1,
    requestDate: new Date().toISOString().split("T")[0],
    comments: "",
  });

  const [errors, setErrors] = useState({});

  // Load location.json, categories, and user details
  useEffect(() => {
    const loadData = async () => {
      try {
        const locationResponse = await fetch("/location.json");
        const locationData = await locationResponse.json();
        setLocations(locationData.locations);

        const categoriesResponse = await api.get("/general/assets");
        setCategories(categoriesResponse.data);

        const userResponse = await api.get(`${API_URL}/general/user-details`);
        setUserDetails(userResponse.data.userDetails);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error loading form data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Prefill user details into form when available
  useEffect(() => {
    if (userDetails && locations.length > 0) {
      let matchedDept = "";
      let matchedSection = "";

      // Support both locationId and location (name)
      let userLocationId = userDetails.locationId?.toString() || "";
      let userLocationName = userDetails.location?.toString() || "";

      // Try to match by id first, fallback to name
      let selectedLocation =
        locations.find((loc) => loc.id.toString() === userLocationId) ||
        locations.find(
          (loc) =>
            loc.name.toLowerCase() === userLocationName.toLowerCase()
        );

      if (selectedLocation) {
        // Match department by name
        if (userDetails.department) {
          const dept = selectedLocation.departments.find(
            (d) =>
              d.name.toLowerCase() ===
              userDetails.department.toLowerCase()
          );
          if (dept) {
            matchedDept = dept.name;

            // Match section by name
            if (userDetails.section) {
              const sec = dept.sections.find(
                (s) =>
                  s.toLowerCase() ===
                  userDetails.section.toLowerCase()
              );
              if (sec) matchedSection = sec;
            }
          }
        }

        setFormData((prev) => ({
          ...prev,
          location: selectedLocation.id.toString(),
          department: matchedDept || userDetails.department || "",
          section: matchedSection || userDetails.section || "",
        }));
      }
    }
  }, [userDetails, locations]);

  // Derived dropdown data
  const selectedLocation = locations.find(
    (loc) => loc.id.toString() === formData.location
  );
  const selectedDepartment = selectedLocation?.departments.find(
    (dept) => dept.name === formData.department
  );

  const isUserDetailsPrefilled =
    userDetails &&
    formData.location &&
    formData.department &&
    formData.section;

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      requestSchema.parse({
        ...formData,
        quantity: Number(formData.quantity),
      });

      const response = await api.post("/request/raise-request", {
        ...formData,
        quantity: Number(formData.quantity),
        requestDate: new Date(formData.requestDate),
      });

      if (response) {
        toast.success("Request submitted successfully!");
        setFormData({
          location:
            selectedLocation?.id.toString() ||
            userDetails?.locationId?.toString() ||
            "",
          department: userDetails?.department || "",
          section: userDetails?.section || "",
          category: "",
          asset: "",
          quantity: 1,
          requestDate: new Date().toISOString().split("T")[0],
          comments: "",
        });
        setErrors({});
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.issues.forEach((issue) => {
          fieldErrors[issue.path[0]] = issue.message;
        });
        setErrors(fieldErrors);
        toast.error("Please fix the highlighted errors!");
      } else {
        console.error("Error submitting request:", error);
        toast.error("Something went wrong. Try again later.");
      }
    }
  };

  // Clear handler
  const handleClear = () => {
    setFormData({
      location:
        selectedLocation?.id.toString() ||
        userDetails?.locationId?.toString() ||
        "",
      department: userDetails?.department || "",
      section: userDetails?.section || "",
      category: "",
      asset: "",
      quantity: 1,
      requestDate: new Date().toISOString().split("T")[0],
      comments: "",
    });
    setErrors({});
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-900/90 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-300">Loading form data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900/90 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-6">
            {isDirect ? "Direct Asset Request" : "Request New Asset"}
            {userDetails && (
              <div className="text-sm text-gray-400 font-normal mt-1">
                Department: {userDetails.department} | Section:{" "}
                {userDetails.section}
              </div>
            )}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
                {isUserDetailsPrefilled && (
                  <span className="text-xs text-gray-400 ml-2">
                    (Auto-filled from your profile)
                  </span>
                )}
              </label>
              <select
                value={formData.location}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: e.target.value,
                    department: "",
                    section: "",
                  })
                }
                className={`w-full px-4 py-2 border border-gray-700 rounded-lg text-white ${
                  isUserDetailsPrefilled
                    ? "bg-gray-700 cursor-not-allowed opacity-75"
                    : "bg-gray-800"
                }`}
                disabled={isUserDetailsPrefilled}
              >
                <option value="">Select Location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location}</p>
              )}
            </div>

            {/* Department & Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Department
                  {isUserDetailsPrefilled && (
                    <span className="text-xs text-gray-400 ml-2">
                      (Auto-filled)
                    </span>
                  )}
                </label>
                <select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      department: e.target.value,
                      section: "",
                    })
                  }
                  className={`w-full px-4 py-2 border border-gray-700 rounded-lg text-white ${
                    isUserDetailsPrefilled
                      ? "bg-gray-700 cursor-not-allowed opacity-75"
                      : "bg-gray-800"
                  }`}
                  disabled={isUserDetailsPrefilled || !formData.location}
                >
                  <option value="">Select Department</option>
                  {selectedLocation?.departments.map((dept, index) => (
                    <option key={index} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.department}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Section
                  {isUserDetailsPrefilled && (
                    <span className="text-xs text-gray-400 ml-2">
                      (Auto-filled)
                    </span>
                  )}
                </label>
                <select
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({ ...formData, section: e.target.value })
                  }
                  className={`w-full px-4 py-2 border border-gray-700 rounded-lg text-white ${
                    isUserDetailsPrefilled
                      ? "bg-gray-700 cursor-not-allowed opacity-75"
                      : "bg-gray-800"
                  }`}
                  disabled={isUserDetailsPrefilled || !formData.department}
                >
                  <option value="">Select Section</option>
                  {selectedDepartment?.sections.map((sec, index) => (
                    <option key={index} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
                {errors.section && (
                  <p className="text-red-500 text-sm mt-1">{errors.section}</p>
                )}
              </div>
            </div>

            {/* Category & Asset */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value,
                      asset: "",
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.categoryName}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Asset
                </label>
                <select
                  value={formData.asset}
                  onChange={(e) =>
                    setFormData({ ...formData, asset: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  disabled={!formData.category}
                >
                  <option value="">Select Asset</option>
                  {categories
                    .find((cat) => cat.categoryName === formData.category)
                    ?.assets.map((asset) => (
                      <option key={asset._id} value={asset.assetName}>
                        {asset.assetName}
                      </option>
                    ))}
                </select>
                {errors.asset && (
                  <p className="text-red-500 text-sm mt-1">{errors.asset}</p>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Request Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Request Date
              </label>
              <input
                type="date"
                value={formData.requestDate}
                onChange={(e) =>
                  setFormData({ ...formData, requestDate: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
              {errors.requestDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.requestDate}
                </p>
              )}
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) =>
                  setFormData({ ...formData, comments: e.target.value })
                }
                rows="4"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Add any additional information..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </button>
              <button
                type="button"
                onClick={handleClear}
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

export default RequestForm;
