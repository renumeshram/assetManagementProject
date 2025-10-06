
import React, { useState, useEffect, useMemo } from "react";
import api from "../../utils/api";
import { useAuth } from "../../hooks/useAuth.js";
const API_URL = import.meta.env.VITE_API_BASE_URL;

const EwasteReport = () => {
  const { user } = useAuth();

  // Single state for the complete location tree
  const [locationTree, setLocationTree] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [treeLoading, setTreeLoading] = useState(false);

  const [filters, setFilters] = useState({
    type: "both",
    period: "month",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startDate: "",
    endDate: "",
    location: "",
    department: "",
    section: "",
  });

  // Fetch the complete location tree once when component mounts
  useEffect(() => {
    const fetchLocationTree = async () => {
      if (!user) return;
      
      setTreeLoading(true);
      try {
        const response = await api.get(`${API_URL}/locations/tree`); // Adjust endpoint as needed
        const treeData = response.data.data || [];
        setLocationTree(treeData);
        
        // Auto-select location for non-superAdmin users
        if (user.role !== "superAdmin" && treeData.length > 0) {
          setFilters(prev => ({ ...prev, location: treeData[0]._id }));
        }
      } catch (err) {
        console.error("Error fetching location tree:", err);
        setError("Failed to load locations data");
      } finally {
        setTreeLoading(false);
      }
    };

    fetchLocationTree();
  }, [user?.id]); // Only depend on user ID to avoid infinite loops

  // Memoized computed values from the tree data
  const computedData = useMemo(() => {
    const selectedLocation = locationTree.find(loc => loc._id === filters.location);
    
    const departments = selectedLocation?.children || [];
    const selectedDepartment = departments.find(dept => dept._id === filters.department);
    const sections = selectedDepartment?.children || [];

    return {
      locations: locationTree,
      departments,
      sections,
      selectedLocation,
      selectedDepartment
    };
  }, [locationTree, filters.location, filters.department]);

  // Handle filter changes with automatic cascading
  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const updated = { ...prev, [key]: value };
      
      // Reset dependent filters when parent changes
      if (key === "location") {
        updated.department = "";
        updated.section = "";
      } else if (key === "department") {
        updated.section = "";
      }
      
      return updated;
    });
  };

  // Validation
  const isReportValid = () => {
    if (user?.role === "superAdmin" && !filters.location) return false;
    
    if (filters.period === "custom") {
      if (!filters.startDate || !filters.endDate) return false;
      if (new Date(filters.endDate) <= new Date(filters.startDate)) return false;
    }
    return true;
  };

  const getValidationError = () => {
    if (user?.role === "superAdmin" && !filters.location) return "Please select a location";
    if (filters.period === "custom") {
      if (!filters.startDate) return "Please select a start date";
      if (!filters.endDate) return "Please select an end date";
      if (new Date(filters.endDate) <= new Date(filters.startDate))
        return "End date must be after start date";
    }
    return "";
  };

  // Generate report
  const generateReport = async () => {
    if (!isReportValid()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });
      
      const res = await api.get(`/ewaste/reports?${queryParams}`);
      const data = res.data;
      
      if (data.success) {
        setReportData(data.data);
      } else {
        setReportData(null);
        setError(data.message || "Failed to generate report");
      }
    } catch (err) {
      console.error(err);
      setReportData(null);
      setError(err.response?.data?.message || err.message || "An error occurred while generating the report");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get display names
  const getDisplayName = (type, id) => {
    switch (type) {
      case 'location':
        return computedData.locations.find(l => l._id === id)?.name || "Unknown Location";
      case 'department':
        return computedData.departments.find(d => d._id === id)?.name || "Unknown Department";
      case 'section':
        return computedData.sections.find(s => s._id === id)?.name || "Unknown Section";
      default:
        return "Unknown";
    }
  };

  // Export CSV
  const exportToCSV = () => {
    if (!reportData) return;
    
    const scopeInfo = {
      location: filters.location === "all" ? "All Locations" : getDisplayName('location', filters.location),
      department: filters.department === "all" ? "All Departments" : 
                  filters.department ? getDisplayName('department', filters.department) : "All",
      section: filters.section === "all" ? "All Sections" : 
               filters.section ? getDisplayName('section', filters.section) : "All",
      period: filters.period === "month" ? `${filters.month}/${filters.year}` : 
              filters.period === "year" ? filters.year : 
              `${filters.startDate} to ${filters.endDate}`
    };

    const csvData = [
      ["E-waste Management Report"],
      [`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`],
      [`Location: ${scopeInfo.location}`],
      [`Department: ${scopeInfo.department}`],
      [`Section: ${scopeInfo.section}`],
      [`Period: ${scopeInfo.period}`],
      [`Type: ${filters.type === 'both' ? 'Generated & Collected' : filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}`],
      [],
      ["SUMMARY"],
      ["Type", "Total Quantity", "Total Weight (kg)"],
      ["Generated", reportData.summary.totalGeneratedQuantity, reportData.summary.totalGeneratedWeight.toFixed(2)],
      ["Collected", reportData.summary.totalCollectedQuantity, reportData.summary.totalCollectedWeight.toFixed(2)],
      [],
      ["DETAILED DATA"],
      ["Type", "Department", "Section", "Category", "Year", "Month", "Quantity", "Weight (kg)"],
    ];

    reportData.generated?.forEach((item) =>
      csvData.push([
        "Generated", item.department, item.section, item.category || "N/A",
        item.year, item.month, item.quantity, item.weight.toFixed(2),
      ])
    );

    reportData.collected?.forEach((item) =>
      csvData.push([
        "Collected", item.department, item.section, item.category || "N/A",
        item.year, item.month, item.quantity, item.weight.toFixed(2),
      ])
    );

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ewaste-report-${new Date().toISOString().split('T')[0]}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export PDF
  const exportToPDF = () => {
    if (!reportData) return;

    const printWindow = window.open("", "_blank");
    const scopeInfo = {
      location: filters.location === "all" ? "All Locations" : getDisplayName('location', filters.location),
      department: filters.department === "all" ? "All Departments" : 
                  filters.department ? getDisplayName('department', filters.department) : "All",
      section: filters.section === "all" ? "All Sections" : 
               filters.section ? getDisplayName('section', filters.section) : "All",
      period: filters.period === "month" ? `${filters.month}/${filters.year}` : 
              filters.period === "year" ? filters.year : 
              `${filters.startDate} to ${filters.endDate}`
    };

    const generatedTableRows = reportData.generated?.map((item) => `
      <tr class="table-row">
        <td>${item.department}</td>
        <td>${item.section}</td>
        <td>${item.category || 'N/A'}</td>
        <td>${item.year}</td>
        <td>${item.month}</td>
        <td>${item.quantity}</td>
        <td>${item.weight.toFixed(2)}</td>
      </tr>
    `).join('') || '<tr class="table-row"><td colspan="7" class="no-data">No generated e-waste records found.</td></tr>';

    const collectedTableRows = reportData.collected?.map((item) => `
      <tr class="table-row">
        <td>${item.department}</td>
        <td>${item.section}</td>
        <td>${item.category || 'N/A'}</td>
        <td>${item.year}</td>
        <td>${item.month}</td>
        <td>${item.quantity}</td>
        <td>${item.weight.toFixed(2)}</td>
      </tr>
    `).join('') || '<tr class="table-row"><td colspan="7" class="no-data">No collected e-waste records found.</td></tr>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>E-waste Management Report</title>
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 40px;
            color: #333;
            line-height: 1.6;
          }
          .container {
            max-width: 1000px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #0055A4;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #0055A4;
            font-size: 28px;
            margin: 0;
          }
          .header p {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
          }
          .scope-info {
            margin-bottom: 30px;
            background: #F5F6F5;
            padding: 15px;
            border-radius: 8px;
            font-size: 14px;
          }
          .scope-info p {
            margin: 5px 0;
            color: #444;
          }
          h2 {
            color: #0055A4;
            font-size: 20px;
            margin: 30px 0 15px;
            border-left: 4px solid #0055A4;
            padding-left: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px 15px;
            text-align: left;
            font-size: 14px;
          }
          th {
            background: #0055A4;
            color: #fff;
            font-weight: 600;
            text-transform: uppercase;
          }
          .table-row:nth-child(even) {
            background: #F9FAFB;
          }
          .table-row:hover {
            background: #E6F0FA;
          }
          .no-data {
            text-align: center;
            color: #666;
            font-style: italic;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            background: #fff;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid;
          }
          .summary-card.generated {
            border-color: #28A745;
          }
          .summary-card.collected {
            border-color: #007BFF;
          }
          .summary-card h3 {
            margin: 0 0 10px;
            font-size: 18px;
            color: #333;
          }
          .summary-card p {
            margin: 5px 0;
            font-size: 14px;
            color: #444;
          }
          .summary-card p span {
            font-weight: 600;
            color: #000;
          }
          @media print {
            body {
              margin: 0;
              font-size: 12pt;
            }
            .container {
              max-width: 100%;
            }
            .header {
              border-bottom: 2px solid #0055A4;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>E-waste Management Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="scope-info">
            <p><strong>Location:</strong> ${scopeInfo.location}</p>
            <p><strong>Department:</strong> ${scopeInfo.department}</p>
            <p><strong>Section:</strong> ${scopeInfo.section}</p>
            <p><strong>Period:</strong> ${scopeInfo.period}</p>
            <p><strong>Type:</strong> ${filters.type === 'both' ? 'Generated & Collected' : filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}</p>
          </div>
          
          <h2>Summary</h2>
          <div class="summary">
            <div class="summary-card generated">
              <h3>Generated E-waste</h3>
              <p>Total Quantity: <span>${reportData.summary.totalGeneratedQuantity}</span></p>
              <p>Total Weight: <span>${reportData.summary.totalGeneratedWeight.toFixed(2)} kg</span></p>
            </div>
            <div class="summary-card collected">
              <h3>Collected E-waste</h3>
              <p>Total Quantity: <span>${reportData.summary.totalCollectedQuantity}</span></p>
              <p>Total Weight: <span>${reportData.summary.totalCollectedWeight.toFixed(2)} kg</span></p>
            </div>
          </div>
          
          ${(filters.type === 'both' || filters.type === 'generated') ? `
            <h2>Generated E-waste Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Section</th>
                  <th>Category</th>
                  <th>Year</th>
                  <th>Month</th>
                  <th>Quantity</th>
                  <th>Weight (kg)</th>
                </tr>
              </thead>
              <tbody>
                ${generatedTableRows}
              </tbody>
            </table>
          ` : ''}
          
          ${(filters.type === 'both' || filters.type === 'collected') ? `
            <h2>Collected E-waste Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Section</th>
                  <th>Category</th>
                  <th>Year</th>
                  <th>Month</th>
                  <th>Quantity</th>
                  <th>Weight (kg)</th>
                </tr>
              </thead>
              <tbody>
                ${collectedTableRows}
              </tbody>
            </table>
          ` : ''}
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (treeLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading locations data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-900 min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-4 sm:mb-0">E-waste Report</h1>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV} 
            disabled={!reportData} 
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-md transition-colors"
          >
            Export CSV
          </button>
          <button 
            onClick={exportToPDF} 
            disabled={!reportData} 
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-2 rounded-md transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-6 rounded-lg shadow mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Location */}
        <div>
          <label className="block mb-1 text-sm font-medium">Location</label>
          {user?.role === "superAdmin" ? (
            <select 
              value={filters.location} 
              onChange={(e) => handleFilterChange("location", e.target.value)} 
              className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select Location</option>
              <option value="all">All Locations</option>
              {computedData.locations.map((loc) => (
                <option key={loc._id} value={loc._id}>{loc.name}</option>
              ))}
            </select>
          ) : (
            <div className="w-full p-2 border rounded-md text-sm bg-gray-700 text-gray-300 border-gray-600">
              {getDisplayName('location', filters.location)}
              <span className="text-xs text-gray-400 block">
                ({user?.role === "admin" ? "Assigned Location" : "Your Location"})
              </span>
            </div>
          )}
        </div>

        {/* Department */}
        <div>
          <label className="block mb-1 text-sm font-medium">Department</label>
          <select 
            value={filters.department} 
            onChange={(e) => handleFilterChange("department", e.target.value)} 
            disabled={!filters.location}
            className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-700 disabled:text-gray-400"
          >
            <option value="">Select Department</option>
            {filters.location && (
              <option value="all">All Departments</option>
            )}
            {computedData.departments.map((dept) => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Section */}
        <div>
          <label className="block mb-1 text-sm font-medium">Section</label>
          <select 
            value={filters.section} 
            onChange={(e) => handleFilterChange("section", e.target.value)} 
            disabled={!filters.department || filters.department === "all"}
            className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-700 disabled:text-gray-400"
          >
            <option value="">Select Section</option>
            {filters.department && filters.department !== "all" && (
              <option value="all">All Sections</option>
            )}
            {computedData.sections.map((sec) => (
              <option key={sec._id} value={sec._id}>{sec.name}</option>
            ))}
          </select>
        </div>

        {/* Period */}
        <div>
          <label className="block mb-1 text-sm font-medium">Period</label>
          <select 
            value={filters.period} 
            onChange={(e) => handleFilterChange("period", e.target.value)} 
            className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Year & Month for Monthly */}
        {filters.period === "month" && (
          <>
            <div>
              <label className="block mb-1 text-sm font-medium">Year</label>
              <input 
                type="number" 
                value={filters.year} 
                onChange={(e) => handleFilterChange("year", e.target.value)} 
                className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Month</label>
              <input 
                type="number" 
                min="1" 
                max="12" 
                value={filters.month} 
                onChange={(e) => handleFilterChange("month", e.target.value)} 
                className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>
          </>
        )}

        {/* Year for Yearly */}
        {filters.period === "year" && (
          <div>
            <label className="block mb-1 text-sm font-medium">Year</label>
            <input 
              type="number" 
              value={filters.year} 
              onChange={(e) => handleFilterChange("year", e.target.value)} 
              className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
            />
          </div>
        )}

        {/* Custom Date Range */}
        {filters.period === "custom" && (
          <>
            <div>
              <label className="block mb-1 text-sm font-medium">Start Date</label>
              <input 
                type="date" 
                value={filters.startDate} 
                onChange={(e) => handleFilterChange("startDate", e.target.value)} 
                className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">End Date</label>
              <input 
                type="date" 
                value={filters.endDate} 
                onChange={(e) => handleFilterChange("endDate", e.target.value)} 
                className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>
          </>
        )}

        {/* Type */}
        <div>
          <label className="block mb-1 text-sm font-medium">Type</label>
          <select 
            value={filters.type} 
            onChange={(e) => handleFilterChange("type", e.target.value)} 
            className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="both">Both</option>
            <option value="generated">Generated</option>
            <option value="collected">Collected</option>
          </select>
        </div>

        {/* Generate Button */}
        <div className="flex items-end">
          <button 
            onClick={generateReport} 
            disabled={!isReportValid() || loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-md disabled:bg-gray-600 transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </span>
            ) : (
              "Generate Report"
            )}
          </button>
        </div>
      </div>

      {/* Validation Error */}
      {!isReportValid() && (
        <div className="bg-yellow-600 text-yellow-100 p-3 rounded-md mb-4">
          {getValidationError()}
        </div>
      )}

      {error && (
        <div className="bg-red-600 text-red-100 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Report Table, Summary, etc. */}
      {reportData && (
        <div className="overflow-x-auto bg-gray-800 p-6 rounded-lg shadow">
          <div className="mb-4 p-3 bg-gray-700 rounded-md">
            <h3 className="text-sm font-semibold mb-1">Report Scope:</h3>
            <p className="text-sm text-gray-300">
              Location: {filters.location === "all" ? "All Locations" : getDisplayName('location', filters.location)}
              {" | "}
              Department: {filters.department === "all" ? "All Departments" : 
                          filters.department ? getDisplayName('department', filters.department) : "All"}
              {" | "}
              Section: {filters.section === "all" ? "All Sections" : 
                       filters.section ? getDisplayName('section', filters.section) : "All"}
              {" | "}
              Period: {filters.period === "month" ? `${filters.month}/${filters.year}` : 
                      filters.period === "year" ? filters.year : 
                      `${filters.startDate} to ${filters.endDate}`}
            </p>
          </div>

          {/* Generated E-waste table */}
          {(filters.type === 'both' || filters.type === 'generated') && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Generated E-waste</h2>
              {reportData.generated?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="px-4 py-2">Department</th>
                        <th className="px-4 py-2">Section</th>
                        <th className="px-4 py-2">Category</th>
                        <th className="px-4 py-2">Year</th>
                        <th className="px-4 py-2">Month</th>
                        <th className="px-4 py-2">Quantity</th>
                        <th className="px-4 py-2">Weight (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.generated.map((item, idx) => (
                        <tr key={`gen-${idx}`} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="px-4 py-2">{item.department}</td>
                          <td className="px-4 py-2">{item.section}</td>
                          <td className="px-4 py-2">{item.category || 'N/A'}</td>
                          <td className="px-4 py-2">{item.year}</td>
                          <td className="px-4 py-2">{item.month}</td>
                          <td className="px-4 py-2">{item.quantity}</td>
                          <td className="px-4 py-2">{item.weight.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400">No generated e-waste records found for the selected criteria.</p>
              )}
            </div>
          )}

          {/* Collected E-waste table */}
          {(filters.type === 'both' || filters.type === 'collected') && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Collected E-waste</h2>
              {reportData.collected?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="px-4 py-2">Department</th>
                        <th className="px-4 py-2">Section</th>
                        <th className="px-4 py-2">Category</th>
                        <th className="px-4 py-2">Year</th>
                        <th className="px-4 py-2">Month</th>
                        <th className="px-4 py-2">Quantity</th>
                        <th className="px-4 py-2">Weight (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.collected.map((item, idx) => (
                        <tr key={`col-${idx}`} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="px-4 py-2">{item.department}</td>
                          <td className="px-4 py-2">{item.section}</td>
                          <td className="px-4 py-2">{item.category || 'N/A'}</td>
                          <td className="px-4 py-2">{item.year}</td>
                          <td className="px-4 py-2">{item.month}</td>
                          <td className="px-4 py-2">{item.quantity}</td>
                          <td className="px-4 py-2">{item.weight.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400">No collected e-waste records found for the selected criteria.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {reportData && (
        <div className="bg-gray-800 p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 p-4 rounded-md">
              <h3 className="font-semibold mb-2 text-green-400">Generated E-waste</h3>
              <p className="text-sm text-gray-300">Total Quantity: <span className="font-medium text-white">{reportData.summary.totalGeneratedQuantity}</span></p>
              <p className="text-sm text-gray-300">Total Weight: <span className="font-medium text-white">{reportData.summary.totalGeneratedWeight.toFixed(2)} kg</span></p>
            </div>
            <div className="bg-gray-700 p-4 rounded-md">
              <h3 className="font-semibold mb-2 text-blue-400">Collected E-waste</h3>
              <p className="text-sm text-gray-300">Total Quantity: <span className="font-medium text-white">{reportData.summary.totalCollectedQuantity}</span></p>
              <p className="text-sm text-gray-300">Total Weight: <span className="font-medium text-white">{reportData.summary.totalCollectedWeight.toFixed(2)} kg</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EwasteReport;
