import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { mockUsers } from "../../data/mockData";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import api from "../../utils/api";
import toast from "react-hot-toast"; // Add this import

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

const UsersList = () => {
  const [users, setUsers] = useState([]);  // Changed from mockUsers to empty array
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get(`${API_URL}/general/all-users`, {
          params: { page: page + 1, limit: pageSize },
        });

        const mapped = response.data.users.map((user) => ({
          ...user,
          id: user._id,
          sapId: user.sapId || "N/A",
          name: user.name || "N/A",
          email: user.email || "N/A",
          department: user.departmentId?.name || "N/A",
          section: user.sectionId?.name || "N/A",
          role: user.role || "N/A",
        }));
        setUsers(mapped);
        setRowCount(response.data.total || 0);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, pageSize, roleFilter]);

  const handleRoleChange = async (userId, newRole) => {
    console.log("Role change triggered:", { userId, newRole }); // Debug log
    let loadingToast; // <-- move it here
    try {
      loadingToast = toast.loading("Updating user role.....");

      const response = await api.put(`${API_URL}/general/${userId}/role`, {
        newRole: newRole,
      });

      console.log("API Response:", response.data); // Debug log

      if (response.data.success) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );

        toast.success("User role updated successfully", {
          id: loadingToast,
        });
      } else {
        toast.error(response.data.msg || "Failed to update user role", {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Error updating user role:", error);

      // Handle different types of errors
      let errorMessage = "Failed to update user role";

      if (error.response) {
        console.error("Error response:", error.response.data); // Debug log
        // Server responded with error status
        errorMessage = error.response.data.message || error.response.data.msg || "Server error occurred";
      } else if (error.request) {
        console.error("Network error:", error.request); // Debug log
        // Network error
        errorMessage = "Network error. Please check your connection.";
      }

      toast.error(errorMessage, {
        id: loadingToast || undefined,
      });
    }
  };

  const columns = [
    {
      field: "serial",
      headerName: "S.No",
      width: 80,
      sortable: false,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
      renderCell: (params) => {
        const rowIndex = params.api.getRowIndexRelativeToVisibleRows(params.id);
        return page * pageSize + (rowIndex + 1);
      },
    },
    {
      field: "name",
      headerName: "Name",
      width: 150,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    {
      field: "sapId",
      headerName: "SAP ID",
      width: 100,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    {
      field: "department",
      headerName: "Department",
      width: 150,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    {
      field: "section",
      headerName: "Section",
      width: 120,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
    },
    {
      field: "role",
      headerName: "Role",
      width: 120,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
      renderCell: (params) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            params.value === "admin"
              ? "bg-red-900 text-red-200"
              : params.value === "manager"
              ? "bg-blue-900 text-blue-200"
              : "bg-green-900 text-green-200"
          }`}
        >
          {params.value.toUpperCase()}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      minWidth: 150,
      headerClassName: "dark-header",
      cellClassName: "dark-cell",
      renderCell: (params) => (
        <select
          value={params.row.role}
          onChange={(e) => {
            console.log("Select changed:", e.target.value); // Debug log
            handleRoleChange(params.row.id, e.target.value);
          }}
          className="px-2 py-1 border border-gray-600 bg-gray-800 text-gray-100 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      ),
    },
  ];

  const filteredUsers = users.filter(
    (user) => roleFilter === "all" || user.role === roleFilter
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="p-6 min-h-screen bg-gray-900">
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-100">
                Users Management
              </h3>
              <div className="flex items-center space-x-4">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Users</option>
                  <option value="manager">Managers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div style={{ height: 400, width: "100%" }}>
              <DataGrid
                rows={filteredUsers}
                columns={columns}
                loading={loading}
                rowCount={rowCount}
                pagination
                paginationMode="server"
                pageSizeOptions={[5, 10, 25]}
                paginationModel={{ page, pageSize }}
                onPaginationModelChange={(model) => {
                  setPage(model.page);
                  setPageSize(model.pageSize);
                }}
                disableRowSelectionOnClick
                className="border-0"
                sx={{
                  "& .dark-header": {
                    backgroundColor: "#374151",
                    color: "#f9fafb",
                  },
                  "& .dark-cell": {
                    color: "#f9fafb",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default UsersList;