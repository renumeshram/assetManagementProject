import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth"; // use your hook

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Dark theme
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#111827", paper: "#1f2937" },
    text: { primary: "#f9fafb", secondary: "#d1d5db" },
  },
});

const UsersList = () => {
  const { user } = useAuth();
  const currentUserRole = user?.role;

  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);

  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [promoteUserId, setPromoteUserId] = useState(null);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get(`${API_URL}/general/all-users`, {
          params: { page: page + 1, limit: pageSize },
        });

        const mapped = res.data.users.map((u) => ({
          ...u,
          id: u._id,
          sapId: u.sapId || "N/A",
          name: u.name || "N/A",
          email: u.email || "N/A",
          department: u.departmentId?.name || "N/A",
          section: u.sectionId?.name || "N/A",
          role: u.role || "N/A",
          location: u.locationId?.location || u.locationId?.name || "N/A",
        }));
        setUsers(mapped);
        setRowCount(res.data.total || 0);
      } catch (err) {
        console.error("Error fetching users:", err);
        toast.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, pageSize, roleFilter]);

  // Fetch locations (only for superAdmin)
  useEffect(() => {
    const fetchLocations = async () => {
      if (currentUserRole !== "superAdmin") return;
      try {
        const res = await api.get(`${API_URL}/locations/`);
        setLocations(res.data.locations || []);
      } catch (err) {
        console.error("Error fetching locations:", err);
        toast.error("Failed to fetch locations");
      }
    };
    fetchLocations();
  }, [currentUserRole]);

  const handleRoleChange = async (userId, newRole) => {
    if (newRole === "admin" && currentUserRole === "superAdmin") {
      setPromoteUserId(userId);
      setOpenLocationModal(true);
      return;
    }
    await updateUserRole(userId, { newRole });
  };

  const updateUserRole = async (userId, payload) => {
    let loadingToast;
    try {
      loadingToast = toast.loading("Updating user role...");
      const res = await api.put(`${API_URL}/general/${userId}/role`, payload);

      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, role: payload.newRole } : u
          )
        );
        toast.success("User role updated successfully", { id: loadingToast });
      } else {
        toast.error(res.data.msg || "Failed to update user role", {
          id: loadingToast,
        });
      }
    } catch (err) {
      console.error("Error updating role:", err);
      toast.error("Failed to update user role", {
        id: loadingToast || undefined,
      });
    }
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) {
      toast.error("Please select a location for the new admin");
      return;
    }
    await updateUserRole(promoteUserId, {
      newRole: "admin",
      assignedLocationId: selectedLocation,
    });
    setOpenLocationModal(false);
    setSelectedLocation("");
    setPromoteUserId(null);
  };

  const columns = [
    {
      field: "serial",
      headerName: "S.No",
      width: 80,
      sortable: false,
      renderCell: (params) =>
        page * pageSize +
        (params.api.getRowIndexRelativeToVisibleRows(params.id) + 1),
    },
    { field: "name", headerName: "Name", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "sapId", headerName: "SAP ID", width: 100 },
    { field: "department", headerName: "Department", width: 150 },
    { field: "section", headerName: "Section", width: 120 },
    { field: "location", headerName: "Location", width: 150 },
    {
      field: "role",
      headerName: "Role",
      width: 120,
      renderCell: (params) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            params.value === "superAdmin"
              ? "bg-purple-900 text-purple-200"
              : params.value === "admin"
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
      renderCell: (params) => (
        <select
          value={params.row.role}
          onChange={(e) => handleRoleChange(params.row.id, e.target.value)}
          className="px-2 py-1 border border-gray-600 bg-gray-800 text-gray-100 rounded text-sm"
        >
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          {user.role === "superAdmin" && (
            <option value="superAdmin">Super Admin</option>
          )}
        </select>
      ),
    },
  ];

  const filteredUsers = users.filter(
    (u) => roleFilter === "all" || u.role === roleFilter
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="p-6 min-h-screen bg-gray-900">
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-100">
              Users Management
            </h3>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="manager">Managers</option>
              <option value="admin">Admins</option>
              <option value="superAdmin">Super Admins</option>
            </select>
          </div>

          <div className="p-6" style={{ height: 400, width: "100%" }}>
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
            />
          </div>
        </div>
      </div>

      {/* Modal for assigning location to admin */}
      <Dialog
        open={openLocationModal}
        onClose={() => setOpenLocationModal(false)}
      >
        <DialogTitle>Select Location for New Admin</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>Location</InputLabel>
            <Select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {locations.map((loc) => (
                <MenuItem key={loc._id} value={loc._id}>
                  {loc.location}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLocationModal(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmLocation}
            variant="contained"
            color="primary"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default UsersList;
