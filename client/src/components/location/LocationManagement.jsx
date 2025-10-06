import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CssBaseline,
  IconButton,
  Chip,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Collapse,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import api from "../../utils/api";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#111827", paper: "#1f2937" },
    text: { primary: "#f9fafb", secondary: "#d1d5db" },
  },
});

const LocationManagement = () => {
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState({});
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [expandedRows, setExpandedRows] = useState({});
  
  // Modals
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [openDepartmentModal, setOpenDepartmentModal] = useState(false);
  const [openSectionModal, setOpenSectionModal] = useState(false);
  
  // Form states
  const [newLocation, setNewLocation] = useState("");
  const [newDepartment, setNewDepartment] = useState({ 
    name: "", 
    locationId: "", 
    hasNoSections: false 
  });
  const [newSection, setNewSection] = useState({ 
    name: "", 
    departmentId: "", 
    locationId: "" 
  });
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);
  const [filter, setFilter] = useState("");

  // Fetch locations
  useEffect(() => {
    fetchLocations();
  }, [page, pageSize]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get(`${API_URL}/locations`, {
        params: { page: page + 1, limit: pageSize },
      });
      setLocations(res.data.locations || []);
      setRowCount(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching locations:", err);
      toast.error("Failed to fetch locations");
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments for a location
  const fetchDepartments = async (locationId) => {
    try {
      const res = await api.get(`${API_URL}/locations/departments/locationid`, {
        params: { locationId },
      });
      
      setDepartments(prev => ({ 
        ...prev, 
        [locationId]: res.data.departments || [] 
      }));
      
      // Fetch sections for each department
      (res.data.departments || []).forEach(dept => fetchSections(dept._id));
    } catch (err) {
      console.error("Error fetching departments:", err);
      toast.error("Failed to fetch departments");
    }
  };

  // Fetch sections for a department
  const fetchSections = async (departmentId) => {
    try {
      const res = await api.get(`${API_URL}/locations/sections/locationid`, {
        params: { departmentId },
      });
      
      setSections(prev => ({ 
        ...prev, 
        [departmentId]: res.data.sections || [] 
      }));
    } catch (err) {
      console.error("Error fetching sections:", err);
      toast.error("Failed to fetch sections");
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (locationId) => {
    const isExpanded = expandedRows[locationId];
    setExpandedRows(prev => ({ ...prev, [locationId]: !isExpanded }));
    
    if (!isExpanded && !departments[locationId]) {
      fetchDepartments(locationId);
    }
  };

  // Add location handler
  const handleAddLocation = async () => {
    if (!newLocation.trim()) {
      toast.error("Location name cannot be empty");
      return;
    }
    try {
      const res = await api.post(`${API_URL}/locations/add-location`, {
        location: newLocation,
      });
      if (res.data.success) {
        toast.success("Location added successfully");
        setOpenLocationModal(false);
        setNewLocation("");
        fetchLocations(); // Refresh the list
      } else {
        toast.error(res.data.msg || "Failed to add location");
      }
    } catch (err) {
      console.error("Error adding location:", err);
      toast.error(err.response?.data?.msg || "Failed to add location");
    }
  };

  // Add department handler
  const handleAddDepartment = async () => {
    if (!newDepartment.name.trim() || !newDepartment.locationId) {
      toast.error("Please fill all required fields");
      return;
    }
    
    try {
      const res = await api.post(`${API_URL}/locations/add-departments`, {
        name: newDepartment.name,
        locationId: newDepartment.locationId,
        hasNoSections: newDepartment.hasNoSections,
      });
      
      if (res.data.success) {
        toast.success("Department added successfully");
        setOpenDepartmentModal(false);
        setNewDepartment({ name: "", locationId: "", hasNoSections: false });
        
        // Refresh departments for this location
        fetchDepartments(newDepartment.locationId);
        
        // If it was expanded, keep it expanded
        setExpandedRows(prev => ({ ...prev, [newDepartment.locationId]: true }));
      } else {
        toast.error(res.data.msg || "Failed to add department");
      }
    } catch (err) {
      console.error("Error adding department:", err);
      toast.error(err.response?.data?.msg || "Failed to add department");
    }
  };

  // Add section handler
  const handleAddSection = async () => {
    if (!newSection.name.trim() || !newSection.departmentId) {
      toast.error("Please fill all required fields");
      return;
    }
    
    try {
      const res = await api.post(`${API_URL}/locations/add-sections`, {
        name: newSection.name,
        departmentId: newSection.departmentId,
      });
      
      if (res.data.success) {
        toast.success("Section added successfully");
        setOpenSectionModal(false);
        setNewSection({ name: "", departmentId: "", locationId: "" });
        
        // Refresh sections for this department
        fetchSections(newSection.departmentId);
      } else {
        toast.error(res.data.msg || "Failed to add section");
      }
    } catch (err) {
      console.error("Error adding section:", err);
      toast.error(err.response?.data?.msg || "Failed to add section");
    }
  };

  // Delete department handler
  const handleDeleteDepartment = async (departmentId, locationId) => {
    if (!window.confirm("Are you sure you want to delete this department?")) {
      return;
    }
    
    try {
      const res = await api.delete(`${API_URL}/departments/${departmentId}`);
      
      if (res.data.success) {
        toast.success("Department deleted successfully");
        fetchDepartments(locationId);
      } else {
        toast.error(res.data.msg || "Failed to delete department");
      }
    } catch (err) {
      console.error("Error deleting department:", err);
      toast.error(err.response?.data?.msg || "Failed to delete department");
    }
  };

  // Delete section handler
  const handleDeleteSection = async (sectionId, departmentId) => {
    if (!window.confirm("Are you sure you want to delete this section?")) {
      return;
    }
    
    try {
      const res = await api.delete(`${API_URL}/sections/${sectionId}`);
      
      if (res.data.success) {
        toast.success("Section deleted successfully");
        fetchSections(departmentId);
      } else {
        toast.error(res.data.msg || "Failed to delete section");
      }
    } catch (err) {
      console.error("Error deleting section:", err);
      toast.error(err.response?.data?.msg || "Failed to delete section");
    }
  };

  // Columns for DataGrid
  const columns = [
    {
      field: "expand",
      headerName: "",
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => toggleRowExpansion(params.row.id)}
        >
          {expandedRows[params.row.id] ? "▲" : "▼"}
        </IconButton>
      ),
    },
    {
      field: "serial",
      headerName: "S.No",
      width: 80,
      sortable: false,
      renderCell: (params) =>
        filteredRows.findIndex((r) => r.id === params.id) + 1,
    },
    { field: "location", headerName: "Location Name", flex: 1 },
    {
      field: "userCount",
      headerName: "Users",
      width: 100,
      renderCell: (params) => (
        <span className="px-2 py-1 rounded bg-gray-700 text-gray-100 text-sm">
          {params.value || 0}
        </span>
      ),
    },
    {
      field: "managerCount",
      headerName: "Managers",
      width: 110,
      renderCell: (params) => (
        <span className="px-2 py-1 rounded bg-blue-700 text-gray-100 text-sm">
          {params.value || 0}
        </span>
      ),
    },
    {
      field: "adminCount",
      headerName: "Admins",
      width: 100,
      renderCell: (params) => (
        <span className="px-2 py-1 rounded bg-purple-700 text-gray-100 text-sm">
          {params.value || 0}
        </span>
      ),
    },
    {
      field: "departments",
      headerName: "Departments",
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={departments[params.row.id]?.length || 0} 
          size="small" 
          variant="outlined"
          color="info"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setNewDepartment({ name: "", locationId: params.row.id, hasNoSections: false });
              setOpenDepartmentModal(true);
            }}
          >
            Add Dept
          </Button>
        </Box>
      ),
    },
  ];

  const rows = locations.map((loc) => ({
    id: loc._id,
    location: loc.location,
    userCount: loc.userCount || 0,
    managerCount: loc.managerCount || 0,
    adminCount: loc.adminCount || 0,
  }));

  const filteredRows = rows.filter((row) =>
    row.location.toLowerCase().includes(filter.toLowerCase())
  );

  // Render expanded row content (departments and sections)
  const renderExpandedContent = (locationId) => {
    const locationDepts = departments[locationId] || [];
    
    return (
      <Collapse in={expandedRows[locationId]} timeout="auto" unmountOnExit>
        <Box sx={{ p: 3, bgcolor: "#374151", borderRadius: 1, m: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <h4 className="text-lg font-semibold text-gray-100">Departments & Sections</h4>
          </Box>
          
          {locationDepts.length === 0 ? (
            <p className="text-gray-400 text-sm">No departments added yet</p>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {locationDepts.map((dept) => (
                <Box
                  key={dept._id}
                  sx={{
                    p: 2,
                    bgcolor: "#1f2937",
                    borderRadius: 1,
                    border: "1px solid #4b5563",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <h5 className="font-semibold text-gray-100">{dept.name}</h5>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => {
                          setNewSection({ name: "", departmentId: dept._id, locationId: locationId });
                          setOpenSectionModal(true);
                        }}
                      >
                        + Add Section
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        color="error"
                        onClick={() => handleDeleteDepartment(dept._id, locationId)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {(sections[dept._id] || []).map((section) => (
                      <Chip
                        key={section._id}
                        label={section.name}
                        size="small"
                        onDelete={() => handleDeleteSection(section._id, dept._id)}
                        sx={{ bgcolor: "#4b5563", color: "#f9fafb" }}
                      />
                    ))}
                    {(!sections[dept._id] || sections[dept._id].length === 0) && (
                      <span className="text-gray-500 text-sm">No sections</span>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="p-6 min-h-screen bg-gray-900">
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-100">
              Location, Department & Section Management
            </h3>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenLocationModal(true)}
            >
              + Add Location
            </Button>
          </div>

          {/* Stats */}
          <div className="p-6 grid grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-300">Total Locations</p>
              <p className="text-2xl font-bold text-gray-100">{rowCount || 0}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-300">Total Users</p>
              <p className="text-2xl font-bold text-gray-100">
                {locations.reduce((sum, loc) => sum + (loc.userCount || 0), 0)}
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-300">Total Managers</p>
              <p className="text-2xl font-bold text-gray-100">
                {locations.reduce((sum, loc) => sum + (loc.managerCount || 0), 0)}
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-300">Total Admins</p>
              <p className="text-2xl font-bold text-gray-100">
                {locations.reduce((sum, loc) => sum + (loc.adminCount || 0), 0)}
              </p>
            </div>
          </div>

          {/* Filter Input */}
          <div className="p-6">
            <TextField
              label="Search Locations"
              variant="outlined"
              size="small"
              fullWidth
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Type to filter locations..."
            />
          </div>

          {/* DataGrid */}
          <div className="p-6">
            <DataGrid
              rows={filteredRows}
              columns={columns}
              loading={loading}
              autoHeight
              rowCount={filteredRows.length}
              pagination
              paginationMode="client"
              pageSizeOptions={[5, 10, 25]}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(model) => {
                setPage(model.page);
                setPageSize(model.pageSize);
              }}
              disableRowSelectionOnClick
            />
            
            {/* Render expanded content below DataGrid */}
            {filteredRows.map((row) => 
              renderExpandedContent(row.id)
            )}
          </div>
        </div>
      </div>

      {/* Add Location Modal */}
      <Dialog open={openLocationModal} onClose={() => setOpenLocationModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Location</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Location Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLocationModal(false)}>Cancel</Button>
          <Button onClick={handleAddLocation} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Department Modal */}
      <Dialog open={openDepartmentModal} onClose={() => setOpenDepartmentModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Department</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Location</InputLabel>
              <Select
                value={newDepartment.locationId}
                label="Select Location"
                onChange={(e) => setNewDepartment({ ...newDepartment, locationId: e.target.value })}
              >
                {locations.map((loc) => (
                  <MenuItem key={loc._id} value={loc._id}>
                    {loc.location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Department Name"
              type="text"
              fullWidth
              variant="outlined"
              value={newDepartment.name}
              onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={newDepartment.hasNoSections}
                  onChange={(e) => setNewDepartment({ ...newDepartment, hasNoSections: e.target.checked })}
                />
              }
              label="This department has no sections (will create section with same name)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDepartmentModal(false)}>Cancel</Button>
          <Button onClick={handleAddDepartment} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Section Modal */}
      <Dialog open={openSectionModal} onClose={() => setOpenSectionModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Section</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Location</InputLabel>
              <Select
                value={newSection.locationId}
                label="Select Location"
                onChange={(e) => {
                  setNewSection({ ...newSection, locationId: e.target.value, departmentId: "" });
                  if (e.target.value && !departments[e.target.value]) {
                    fetchDepartments(e.target.value);
                  }
                }}
              >
                {locations.map((loc) => (
                  <MenuItem key={loc._id} value={loc._id}>
                    {loc.location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!newSection.locationId}>
              <InputLabel>Select Department</InputLabel>
              <Select
                value={newSection.departmentId}
                label="Select Department"
                onChange={(e) => setNewSection({ ...newSection, departmentId: e.target.value })}
              >
                {(departments[newSection.locationId] || []).map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Section Name"
              type="text"
              fullWidth
              variant="outlined"
              value={newSection.name}
              onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSectionModal(false)}>Cancel</Button>
          <Button onClick={handleAddSection} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default LocationManagement;