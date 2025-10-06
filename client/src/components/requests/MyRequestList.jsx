import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import api from "../../utils/api";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

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
  },
});

const MyRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get(`${API_URL}/request/my-requests`);
        const mapped = response.data.map((req) => ({
          ...req,
          id: req._id,
          assetName: req.assetId?.assetName || "N/A",
          requestDate: req.requestDate
            ? new Date(req.requestDate).toLocaleDateString('en-GB')
            : "N/A",
            rejectionReason: req.rejectionReason || "",
        }));
        setRequests(mapped);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(
    (req) => statusFilter === "all" || req.status === statusFilter
  );

  const columns = [
    { 
      field: "assetName", 
      headerName: "Asset", 
      width: 200,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    { 
      field: "quantity", 
      headerName: "Qty", 
      width: 70,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
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
      width: 110,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    { 
      field: "rejectionReason", 
      headerName: "Comments", 
      flex: 1,
      minWidth: 150,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-100">My Requests</h3>
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

          <div style={{ height: 400, width: "100%" }}>
            <DataGrid
              rows={filteredRequests}
              columns={columns}
              loading={loading}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              pageSizeOptions={[5, 10, 25]}
              disableRowSelectionOnClick
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
      </div>
    </ThemeProvider>
  );
};

export default MyRequestsList;