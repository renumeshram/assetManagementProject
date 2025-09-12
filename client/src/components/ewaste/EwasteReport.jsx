// components/EwasteReport.jsx
import React, { useState, useEffect } from "react";
import api from "../../utils/api"

const EwasteReport = () => {
  const [locations, setLocations] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Add error state for debugging

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

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // Load location.json
  useEffect(() => {
    fetch("/location.json")
      .then((res) => res.json())
      .then((data) => setLocations(data.locations))
      .catch((err) => console.error("Error loading locations:", err));
  }, []);

  // Derived dropdowns
  const selectedLocation = locations.find(
    (loc) => loc.id.toString() === filters.location
  );
  const selectedDepartment = selectedLocation?.departments.find(
    (dept) => dept.name === filters.department
  );

  // Validation functions
  const isReportValid = () => {
    // Check if location, department, and section are selected
    if (!filters.location || !filters.department || !filters.section) {
      return false;
    }

    // Additional validation based on period type
    if (filters.period === "custom") {
      if (!filters.startDate || !filters.endDate) {
        return false;
      }
      // Ensure end date is after start date
      if (new Date(filters.endDate) <= new Date(filters.startDate)) {
        return false;
      }
    }

    return true;
  };

  // Get validation error message
  const getValidationError = () => {
    if (!filters.location) return "Please select a location";
    if (!filters.department) return "Please select a department";
    if (!filters.section) return "Please select a section";
    
    if (filters.period === "custom") {
      if (!filters.startDate) return "Please select a start date";
      if (!filters.endDate) return "Please select an end date";
      if (new Date(filters.endDate) <= new Date(filters.startDate)) {
        return "End date must be after start date";
      }
    }
    
    return "";
  };

  // Handle filters
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Generate report
  const generateReport = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      console.log("Making API call to:", `${API_URL}/ewaste/reports?${queryParams}`); // Debug log

      const res = await api.get(`/ewaste/reports?${queryParams}`); // Remove API_URL if api already has base URL
      
      // Handle response based on your API structure
      let data;
      if (res.data) {
        // If using axios, response is in res.data
        data = res.data;
      } else {
        // If using fetch wrapper, might need .json()
        data = await res.json();
      }

      console.log("API Response:", data); // Debug log

      if (data.success) {
        setReportData(data.data);
      } else {
        setReportData(null);
        setError(data.message || "Failed to generate report");
      }
    } catch (err) {
      console.error("Error generating report:", err);
      setError(err.message || "An error occurred while generating the report");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // Export PDF
  const exportToPDF = () => {
    if (!reportData) return;

    // Create a new window for the PDF content
    const printWindow = window.open('', '_blank');
    
    // Get current date for report generation
    const now = new Date();
    const reportDate = now.toLocaleDateString();
    const reportTime = now.toLocaleTimeString();
    
    // Get filter descriptions
    const selectedLocationName = selectedLocation?.name || "All Locations";
    const selectedDepartmentName = filters.department || "All Departments";
    const selectedSectionName = filters.section || "All Sections";
    
    let periodDescription = "";
    if (filters.period === "month") {
      const monthName = new Date(0, filters.month - 1).toLocaleString("default", { month: "long" });
      periodDescription = `${monthName} ${filters.year}`;
    } else if (filters.period === "year") {
      periodDescription = `Year ${filters.year}`;
    } else if (filters.period === "custom") {
      periodDescription = `${filters.startDate} to ${filters.endDate}`;
    }

    // HTML content for PDF
    const pdfContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>E-waste Report</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                color: #333;
                line-height: 1.4;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #4A5568;
                padding-bottom: 20px;
            }
            .header h1 { 
                color: #2D3748; 
                margin: 0; 
                font-size: 28px;
            }
            .header .subtitle { 
                color: #718096; 
                margin: 5px 0;
                font-size: 14px;
            }
            .filters { 
                background: #F7FAFC; 
                padding: 15px; 
                margin: 20px 0; 
                border-radius: 8px;
                border-left: 4px solid #4299E1;
            }
            .filters h3 { 
                margin: 0 0 10px 0; 
                color: #2D3748;
                font-size: 16px;
            }
            .filter-row { 
                display: flex; 
                flex-wrap: wrap; 
                gap: 20px;
                font-size: 14px;
            }
            .filter-item { 
                flex: 1; 
                min-width: 200px;
            }
            .filter-label { 
                font-weight: bold; 
                color: #4A5568;
            }
            .summary { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 20px; 
                margin: 20px 0;
            }
            .summary-card { 
                background: #F7FAFC; 
                padding: 20px; 
                border-radius: 8px; 
                text-align: center;
            }
            .summary-card.generated { 
                border-left: 4px solid #F56565;
            }
            .summary-card.collected { 
                border-left: 4px solid #48BB78;
            }
            .summary-card h3 { 
                margin: 0 0 15px 0; 
                font-size: 18px;
            }
            .summary-stats { 
                display: flex; 
                justify-content: space-around;
            }
            .summary-stat { 
                text-align: center;
            }
            .summary-stat .value { 
                font-size: 24px; 
                font-weight: bold; 
                color: #2D3748;
            }
            .summary-stat .label { 
                font-size: 12px; 
                color: #718096; 
                margin-top: 5px;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
                font-size: 12px;
            }
            th, td { 
                border: 1px solid #E2E8F0; 
                padding: 8px; 
                text-align: left;
            }
            th { 
                background-color: #EDF2F7; 
                font-weight: bold; 
                color: #2D3748;
            }
            tr:nth-child(even) { 
                background-color: #F7FAFC;
            }
            .table-title { 
                font-size: 18px; 
                font-weight: bold; 
                margin: 30px 0 10px 0; 
                color: #2D3748;
            }
            .text-right { 
                text-align: right;
            }
            .footer { 
                margin-top: 40px; 
                text-align: center; 
                font-size: 12px; 
                color: #718096; 
                border-top: 1px solid #E2E8F0; 
                padding-top: 20px;
            }
            @media print {
                body { margin: 0; }
                .no-print { display: none; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; }
                th { page-break-after: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>E-waste Management Report</h1>
            <div class="subtitle">Generated on ${reportDate} at ${reportTime}</div>
        </div>

        <div class="filters">
            <h3>Report Filters</h3>
            <div class="filter-row">
                <div class="filter-item">
                    <span class="filter-label">Report Type:</span> ${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}
                </div>
                <div class="filter-item">
                    <span class="filter-label">Period:</span> ${periodDescription}
                </div>
            </div>
            <div class="filter-row">
                <div class="filter-item">
                    <span class="filter-label">Location:</span> ${selectedLocationName}
                </div>
                <div class="filter-item">
                    <span class="filter-label">Department:</span> ${selectedDepartmentName}
                </div>
                <div class="filter-item">
                    <span class="filter-label">Section:</span> ${selectedSectionName}
                </div>
            </div>
        </div>

        <div class="summary">
            <div class="summary-card generated">
                <h3>E-waste Generated</h3>
                <div class="summary-stats">
                    <div class="summary-stat">
                        <div class="value">${reportData.summary?.totalGeneratedWeight?.toFixed(2) || 0}</div>
                        <div class="label">kg</div>
                    </div>
                    <div class="summary-stat">
                        <div class="value">${reportData.summary?.totalGeneratedQuantity || 0}</div>
                        <div class="label">Items</div>
                    </div>
                </div>
            </div>
            <div class="summary-card collected">
                <h3>E-waste Collected</h3>
                <div class="summary-stats">
                    <div class="summary-stat">
                        <div class="value">${reportData.summary?.totalCollectedWeight?.toFixed(2) || 0}</div>
                        <div class="label">kg</div>
                    </div>
                    <div class="summary-stat">
                        <div class="value">${reportData.summary?.totalCollectedQuantity || 0}</div>
                        <div class="label">Items</div>
                    </div>
                </div>
            </div>
        </div>

        ${(filters.type === "both" || filters.type === "generated") && reportData.generated && reportData.generated.length > 0 ? `
        <div class="table-title">E-waste Generated Details</div>
        <table>
            <thead>
                <tr>
                    <th>Department</th>
                    
                    <th>Year</th>
                    <th>Month</th>
                    <th class="text-right">Quantity</th>
                    <th class="text-right">Weight (kg)</th>
                    
                </tr>
            </thead>
            <tbody>
                ${reportData.generated.map(item => `
                    <tr>
                        <td>${item.department}</td>
                        
                        <td>${item.year}</td>
                        <td>${item.month}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${item.weight?.toFixed(2) || 0}</td>
                        
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}

        ${(filters.type === "both" || filters.type === "collected") && reportData.collected && reportData.collected.length > 0 ? `
        <div class="table-title">E-waste Collected Details</div>
        <table>
            <thead>
                <tr>
                    <th>Department</th>
                    
                    <th>Year</th>
                    <th>Month</th>
                    <th class="text-right">Quantity</th>
                    <th class="text-right">Weight (kg)</th>
                    
                </tr>
            </thead>
            <tbody>
                ${reportData.collected.map(item => `
                    <tr>
                        <td>${item.department}</td>
                        
                        <td>${item.year}</td>
                        <td>${item.month}</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">${item.weight?.toFixed(2) || 0}</td>
                        
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}

        <div class="footer">
            <p>This report was automatically generated by the E-waste Management System.</p>
            <p>Total records processed: ${reportData.generated?.length || 0} generated, ${reportData.collected?.length || 0} collected</p>
        </div>

        <script>
            // Auto-print when page loads
            window.onload = function() {
                window.print();
                window.onafterprint = function() {
                    window.close();
                };
            };
        </script>
    </body>
    </html>
    `;

    // Write content to new window and trigger print
    printWindow.document.write(pdfContent);
    printWindow.document.close();
  };

  // Export CSV
  const exportToCSV = () => {
    if (!reportData) return;

    const csvData = [];
    csvData.push([
      "Type",
      "Department",
      // "Category",
      "Year",
      "Month",
      "Quantity",
      "Weight (kg)",
      // "Transactions",
    ]);

    reportData.generated?.forEach((item) => {
      csvData.push([
        "Generated",
        item.department,
        // item.category,
        item.year,
        item.month,
        item.quantity,
        item.weight.toFixed(2),
        // item.transactionCount,
      ]);
    });

    reportData.collected?.forEach((item) => {
      csvData.push([
        "Collected",
        item.department,
        // item.category,
        item.year,
        item.month,
        item.quantity,
        item.weight.toFixed(2),
        // item.transactionCount,
      ]);
    });

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ewaste-report-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-900 min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-4 sm:mb-0">
          E-waste Report
        </h1>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            disabled={!reportData}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-md font-medium transition disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={exportToPDF}
            disabled={!reportData}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-md font-medium transition disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-6 rounded-lg shadow mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Report Type</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white"
          >
            <option value="both">Both</option>
            <option value="generated">Generated</option>
            <option value="collected">Collected</option>
          </select>
        </div>

        {/* Period */}
        <div>
          <label className="block text-sm font-medium mb-1">Period</label>
          <select
            value={filters.period}
            onChange={(e) => handleFilterChange("period", e.target.value)}
            className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white"
          >
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Year & Month */}
        {filters.period === "month" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <input
                type="number"
                min="2020"
                max="2030"
                value={filters.year}
                onChange={(e) => handleFilterChange("year", e.target.value)}
                className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange("month", e.target.value)}
                className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Year only */}
        {filters.period === "year" && (
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <input
              type="number"
              min="2020"
              max="2030"
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
              className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white"
            />
          </div>
        )}

        {/* Custom range */}
        {filters.period === "custom" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white"
              />
            </div>
          </>
        )}

        {/* Location / Department / Section */}
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <select
            value={filters.location}
            onChange={(e) =>
              setFilters({ ...filters, location: e.target.value, department: "", section: "" })
            }
            className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Department</label>
          <select
            value={filters.department}
            onChange={(e) =>
              setFilters({ ...filters, department: e.target.value, section: "" })
            }
            disabled={!filters.location}
            className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white disabled:bg-gray-700"
          >
            <option value="">All Departments</option>
            {selectedLocation?.departments.map((dept, i) => (
              <option key={i} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Section</label>
          <select
            value={filters.section}
            onChange={(e) => handleFilterChange("section", e.target.value)}
            disabled={!filters.department}
            className="w-full p-2 border rounded-md text-sm bg-gray-900 text-white disabled:bg-gray-700"
          >
            <option value="">All Sections</option>
            {selectedDepartment?.sections.map((sec, i) => (
              <option key={i} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={generateReport}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-md transition"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Validation Message - Only show for date validation now */}
      {!isReportValid() && (
        <div className="bg-yellow-800 p-4 rounded-lg shadow mb-8 border-l-4 border-yellow-500">
          <p className="text-yellow-200">
            <strong>Validation Required:</strong> {getValidationError()}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-800 p-4 rounded-lg shadow mb-8 border-l-4 border-red-500">
          <p className="text-red-200">Error: {error}</p>
        </div>
      )}

      {/* Summary */}
      {reportData && reportData.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow border-l-4 border-red-500">
            <h3 className="text-lg font-semibold mb-4">Generated</h3>
            <div className="flex justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {reportData.summary.totalGeneratedWeight?.toFixed(2) || 0}
                </div>
                <div className="text-sm text-gray-400">kg</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {reportData.summary.totalGeneratedQuantity || 0}
                </div>
                <div className="text-sm text-gray-400">Items</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-lg font-semibold mb-4">Collected</h3>
            <div className="flex justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {reportData.summary.totalCollectedWeight?.toFixed(2) || 0}
                </div>
                <div className="text-sm text-gray-400">kg</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {reportData.summary.totalCollectedQuantity || 0}
                </div>
                <div className="text-sm text-gray-400">Items</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tables */}
      {reportData && reportData.generated && (filters.type === "both" || filters.type === "generated") && (
        <div className="bg-gray-800 p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold mb-4">E-waste Generated</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-2 text-left text-sm">Department</th>
                  {/* <th className="p-2 text-left text-sm">Category</th> */}
                  <th className="p-2 text-left text-sm">Year</th>
                  <th className="p-2 text-left text-sm">Month</th>
                  <th className="p-2 text-right text-sm">Quantity</th>
                  <th className="p-2 text-right text-sm">Weight (kg)</th>
                  {/* <th className="p-2 text-right text-sm">Transactions</th> */}
                </tr>
              </thead>
              <tbody>
                {reportData.generated.map((item, i) => (
                  <tr key={i} className="border-t border-gray-700">
                    <td className="p-2">{item.department}</td>
                    {/* <td className="p-2">{item.category}</td> */}
                    <td className="p-2">{item.year}</td>
                    <td className="p-2">{item.month}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">{item.weight?.toFixed(2)}</td>
                    {/* <td className="p-2 text-right">{item.transactionCount}</td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportData && reportData.collected && (filters.type === "both" || filters.type === "collected") && (
        <div className="bg-gray-800 p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold mb-4">E-waste Collected</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-2 text-left text-sm">Department</th>
                  {/* <th className="p-2 text-left text-sm">Category</th> */}
                  <th className="p-2 text-left text-sm">Year</th>
                  <th className="p-2 text-left text-sm">Month</th>
                  <th className="p-2 text-right text-sm">Quantity</th>
                  <th className="p-2 text-right text-sm">Weight (kg)</th>
                  {/* <th className="p-2 text-right text-sm">Transactions</th> */}
                </tr>
              </thead>
              <tbody>
                {reportData.collected.map((item, i) => (
                  <tr key={i} className="border-t border-gray-700">
                    <td className="p-2">{item.department}</td>
                    {/* <td className="p-2">{item.category}</td> */}
                    <td className="p-2">{item.year}</td>
                    <td className="p-2">{item.month}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">{item.weight?.toFixed(2)}</td>
                    {/* <td className="p-2 text-right">{item.transactionCount}</td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No data */}
      {reportData && !loading && 
       (!reportData.generated || reportData.generated.length === 0) && 
       (!reportData.collected || reportData.collected.length === 0) && (
        <div className="bg-gray-800 p-12 rounded-lg shadow text-center">
          <p className="text-gray-400">No e-waste data found for the selected criteria.</p>
        </div>
      )}

      {loading && (
        <div className="bg-gray-800 p-12 rounded-lg shadow text-center">
          <p className="text-blue-400">Generating report...</p>
        </div>
      )}
    </div>
  );
};

export default EwasteReport;