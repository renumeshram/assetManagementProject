// AllRequestsList.jsx
import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { XCircle, Package } from "lucide-react";
import api from "../../utils/api";
import { statusForUrl } from "../../utils";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import toast from "react-hot-toast";
import IssueAssetPopup from "./IssueAssetPopup";
import RejectRequestPopup from "./RejectRequestPopup";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Enhanced dark theme with comprehensive DataGrid overrides
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#111827", // gray-900
      paper: "#1f2937", // gray-800
    },
    text: {
      primary: "#f9fafb", // gray-50
      secondary: "#d1d5db", // gray-300
    },
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: "#1f2937", // gray-800
          border: "1px solid #374151", // gray-700
          color: "#f9fafb", // gray-50
          "& .MuiDataGrid-cell": {
            borderBottomColor: "#374151", // gray-700
            color: "#f9fafb", // gray-50
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#374151", // gray-700
            borderBottomColor: "#4b5563", // gray-600
            color: "#f9fafb", // gray-50
          },
          "& .MuiDataGrid-columnHeader": {
            color: "#f9fafb", // gray-50
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            color: "#f9fafb", // gray-50
          },
          "& .MuiDataGrid-row": {
            borderBottomColor: "#374151", // gray-700
            "&:hover": {
              backgroundColor: "#374151", // gray-700
            },
          },
          "& .MuiDataGrid-footerContainer": {
            backgroundColor: "#374151", // gray-700
            borderTopColor: "#4b5563", // gray-600
            color: "#f9fafb", // gray-50
          },
          "& .MuiTablePagination-root": {
            color: "#f9fafb", // gray-50
          },
          "& .MuiIconButton-root": {
            color: "#d1d5db", // gray-300
          },
          "& .MuiSelect-root": {
            color: "#f9fafb", // gray-50
          },
          "& .MuiDataGrid-selectedRowCount": {
            color: "#f9fafb", // gray-50
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: "#1f2937", // gray-800
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        toolbar: {
          minHeight: "36px", // shrink height
        },
        select: {
          paddingTop: "4px",
          paddingBottom: "4px",
          fontSize: "0.875rem", // smaller text (14px)
          color: "#f9fafb",
        },
        displayedRows: {
          fontSize: "0.875rem",
          color: "#f9fafb",
        },
        selectIcon: {
          color: "#9ca3af", // gray-400
        },
      },
    },
  },
});

const AllRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Popup states
  const [issuePopupOpen, setIssuePopupOpen] = useState(false);
  const [rejectPopupOpen, setRejectPopupOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get(`${API_URL}/request/all-request`);
        const mapped = response.data.requests.map((req) => ({
          ...req,
          id: req._id,
          assetName: req.assetId?.assetName || "N/A",
          sapId: req.requestorId?.sapId || "N/A",
          department: req.departmentId?.name || "N/A",
          section: req.sectionId?.name || "N/A",
          requestDate: req.requestDate
            ? new Date(req.requestDate).toLocaleDateString('en-GB')
            : "N/A",
        }));
        setRequests(mapped);
      } catch (error) {
        console.error("Error fetching all requests:", error);
        toast.error("Failed to fetch requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Handle opening issue popup
  const handleIssueClick = (request) => {
    setSelectedRequest(request);
    setIssuePopupOpen(true);
  };

  // Handle opening reject popup
  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectPopupOpen(true);
  };

  // Handle successful action from popups
  const handleActionSuccess = (requestId, newStatus) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: newStatus } : req
      )
    );
  };

  // Close popups
  const closeIssuePopup = () => {
    setIssuePopupOpen(false);
    setSelectedRequest(null);
  };

  const closeRejectPopup = () => {
    setRejectPopupOpen(false);
    setSelectedRequest(null);
  };

  const filteredRequests = requests.filter(
    (req) => statusFilter === "all" || req.status === statusFilter
  );

  const columns = [
    { 
      field: "sapId", 
      headerName: "SAP ID", 
      minWidth: 100,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    { 
      field: "department", 
      headerName: "Department", 
      minWidth: 120,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    { 
      field: "section", 
      headerName: "Section", 
      minWidth: 120,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    { 
      field: "assetName", 
      headerName: "Asset", 
      minWidth: 150,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    { 
      field: "quantity", 
      headerName: "Qty", 
      minWidth: 70,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 110,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
      renderCell: (params) => {
        const status = params.value?.toLowerCase();
        const styles = {
          pending: "bg-yellow-900 text-yellow-200 border border-yellow-700",
          issued: "bg-blue-900 text-blue-200 border border-blue-700",
          rejected: "bg-red-900 text-red-200 border border-red-700",
        };
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
              styles[status] || "bg-gray-700 text-gray-300"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    { 
      field: "requestDate", 
      headerName: "Date", 
      minWidth: 100,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 160,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
      renderCell: (params) => {
        // Only show actions for pending requests
        if (params.row.status !== 'pending') {
          return <span className="text-gray-500 text-sm">No actions</span>;
        }
        
        return (
          <div className="flex space-x-1">
            <button
              onClick={() => handleRejectClick(params.row)}
              className="p-1 text-red-400 hover:bg-red-900/50 rounded transition-colors"
              title="Reject"
            >
              <XCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleIssueClick(params.row)}
              className="p-1 text-blue-400 hover:bg-blue-900/50 rounded transition-colors"
              title="Issue"
            >
              <Package className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-100">All Requests</h3>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="issued">Issued</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div style={{ height: 450, width: "100%" }}>
            <DataGrid
              rows={filteredRequests}
              columns={columns}
              loading={loading}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              pageSizeOptions={[5, 10, 25]}
              disableRowSelectionOnClick
              disableExtendRowFullWidth
              className="border-0"
              sx={{
                '& .dark-header': {
                  backgroundColor: '#374151',
                  color: '#f9fafb',
                },
                '& .dark-cell': {
                  color: '#f9fafb',
                },
              }}
            />
          </div>
        </div>

        {/* Issue Asset Popup */}
        <IssueAssetPopup
          isOpen={issuePopupOpen}
          onClose={closeIssuePopup}
          request={selectedRequest}
          onSuccess={handleActionSuccess}
        />

        {/* Reject Request Popup */}
        <RejectRequestPopup
          isOpen={rejectPopupOpen}
          onClose={closeRejectPopup}
          request={selectedRequest}
          onSuccess={handleActionSuccess}
        />
      </div>
    </ThemeProvider>
  );
};

export default AllRequestsList;