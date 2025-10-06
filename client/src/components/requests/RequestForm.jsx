import React, { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { requestSchema } from "../../schemas/requestSchemas";
import api from "../../utils/api";
import { z } from "zod";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RequestForm = ({ isDirect = false }) => {
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
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

  // Load locations, categories, and user details on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch locations
        const locationResponse = await api.get(`${API_URL}/auth/locations`);
        if (locationResponse.data.success && Array.isArray(locationResponse.data.locations)) {
          setLocations(locationResponse.data.locations);
        }

        // Fetch categories
        const categoriesResponse = await api.get("/general/assets");
        setCategories(categoriesResponse.data);

        // Fetch user details
        const userResponse = await api.get(`${API_URL}/general/user-details`);
        setUserDetails(userResponse.data.userDetails);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error loading form data");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Prefill location and fetch departments when user details are available
  useEffect(() => {
    const prefillUserData = async () => {
      if (userDetails && locations.length > 0) {
        const userLocationId = userDetails.locationId || userDetails.location?._id;
        
        if (userLocationId) {
          // Set location
          setFormData((prev) => ({
            ...prev,
            location: userLocationId.toString(),
          }));

          // Fetch departments for user's location
          try {
            const deptResponse = await api.get(`${API_URL}/departments-list`, {
              params: { locationId: userLocationId },
            });
            
            if (deptResponse.data.success && Array.isArray(deptResponse.data.data)) {
              setDepartments(deptResponse.data.data);
              
              // Find and set user's department
              const userDeptId = userDetails.departmentId || userDetails.department?._id;
              if (userDeptId) {
                const matchedDept = deptResponse.data.data.find(
                  (d) => d._id.toString() === userDeptId.toString()
                );
                
                if (matchedDept) {
                  setFormData((prev) => ({
                    ...prev,
                    department: matchedDept._id.toString(),
                  }));

                  // Fetch sections for user's department
                  const sectResponse = await api.get(`${API_URL}/sections-list`, {
                    params: { departmentId: matchedDept._id },
                  });
                  
                  if (sectResponse.data.success && Array.isArray(sectResponse.data.data)) {
                    setSections(sectResponse.data.data);
                    
                    // Find and set user's section
                    const userSectId = userDetails.sectionId || userDetails.section?._id;
                    if (userSectId) {
                      const matchedSect = sectResponse.data.data.find(
                        (s) => s._id.toString() === userSectId.toString()
                      );
                      
                      if (matchedSect) {
                        setFormData((prev) => ({
                          ...prev,
                          section: matchedSect._id.toString(),
                        }));
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error prefilling user data:", error);
          }
        }
      }
    };

    prefillUserData();
  }, [userDetails, locations]);

  // Fetch departments when location changes
  const handleLocationChange = async (locationId) => {
    setFormData({
      ...formData,
      location: locationId,
      department: "",
      section: "",
    });
    setDepartments([]);
    setSections([]);

    if (locationId) {
      try {
        const response = await api.get(`${API_URL}/departments-list`, {
          params: { locationId },
        });
        
        if (response.data.success && Array.isArray(response.data.data)) {
          setDepartments(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
        toast.error("Failed to load departments");
      }
    }
  };

  // Fetch sections when department changes
  const handleDepartmentChange = async (departmentId) => {
    setFormData({
      ...formData,
      department: departmentId,
      section: "",
    });
    setSections([]);

    if (departmentId) {
      try {
        const response = await api.get(`${API_URL}/sections-list`, {
          params: { departmentId },
        });
        
        if (response.data.success && Array.isArray(response.data.data)) {
          setSections(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching sections:", error);
        toast.error("Failed to load sections");
      }
    }
  };

  // Get display names for user details
  const getUserLocationName = () => {
    if (!userDetails) return "";
    // First try to find in locations array
    const loc = locations.find(
      (l) => l._id.toString() === (userDetails.location?._id || userDetails.location)?.toString()
    );
    if (loc){
      formData.location = loc.location
      return loc.location;
    } 
      formData.location = userDetails?.location
    
    // Fallback to userDetails object properties
    return userDetails.location?.location || userDetails.location || "";
  };

  const getUserDepartmentName = () => {
    if (!userDetails) return "";
    // First try to find in departments array
    const dept = departments.find(
      (d) => d._id.toString() === (userDetails.department?._id || userDetails.department)?.toString()
    );
    if (dept) {
      formData.department = dept
      return dept
    };

    formData.department = userDetails?.department
    
    // Fallback to userDetails object properties
    return userDetails.department?.name || userDetails.department || "";
  };

  const getUserSectionName = () => {
    if (!userDetails) return "";
    // First try to find in sections array
    const sect = sections.find(
      (s) => s._id.toString() === (userDetails.section?._id || userDetails.section)?.toString()
    );
    if (sect) {
      formData.section = sect
      return sect.name
    };
    
    formData.section = userDetails?.section
    // Fallback to userDetails object properties
    return userDetails.section?.name || userDetails.section || "";
  };

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

      console.log("🚀 ~ handleSubmit ~ userDetails:", userDetails)
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        requestDate: new Date(formData.requestDate),
        location: formData.location || userDetails?.location || null,
        department: formData.department || userDetails?.department || null,
        section: formData.section || userDetails?.section || null,
      }
      console.log("🚀 ~ handleSubmit ~ payload:", payload)

      const response = await api.post("/request/raise-request", payload );

      if (response) {
        toast.success("Request submitted successfully!");
        
        // Reset form but keep user details
        setFormData({
          location: formData.location,
          department: formData.department,
          section: formData.section,
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
        toast.error(error.response?.data?.message || "Something went wrong. Try again later.");
      }
    }
  };

  // Clear handler
  const handleClear = () => {
    setFormData({
      location: formData.location,
      department: formData.department,
      section: formData.section,
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
                Location: {getUserLocationName()} | Department: {getUserDepartmentName()} | Section: {getUserSectionName()}
              </div>
            )}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
                {userDetails && (
                  <span className="text-xs text-gray-400 ml-2">
                    (From your profile)
                  </span>
                )}
              </label>
              {userDetails ? (
                <div className="w-full px-4 py-2 bg-gray-700 border border-gray-700 rounded-lg text-gray-300 opacity-75">
                  {getUserLocationName()}
                </div>
              ) : (
                <select
                  value={formData.location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg text-white bg-gray-800"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.location}
                    </option>
                  ))}
                </select>
              )}
              {errors.location && (
                <p className="text-red-500 text-sm mt-1">{errors.location}</p>
              )}
            </div>

            {/* Department & Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Department
                  {userDetails && (
                    <span className="text-xs text-gray-400 ml-2">
                      (From your profile)
                    </span>
                  )}
                </label>
                {userDetails ? (
                  <div className="w-full px-4 py-2 bg-gray-700 border border-gray-700 rounded-lg text-gray-300 opacity-75">
                    {getUserDepartmentName()}
                  </div>
                ) : (
                  <select
                    value={formData.department}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg text-white bg-gray-800"
                    disabled={!formData.location}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.department && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.department}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Section
                  {userDetails && (
                    <span className="text-xs text-gray-400 ml-2">
                      (From your profile)
                    </span>
                  )}
                </label>
                {userDetails ? (
                  <div className="w-full px-4 py-2 bg-gray-700 border border-gray-700 rounded-lg text-gray-300 opacity-75">
                    {getUserSectionName()}
                  </div>
                ) : (
                  <select
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg text-white bg-gray-800"
                    disabled={!formData.department}
                  >
                    <option value="">Select Section</option>
                    {sections.map((sec) => (
                      <option key={sec._id} value={sec._id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                )}
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