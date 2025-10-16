import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Edit } from "lucide-react";
import api from "../../utils/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth.js";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  createTheme,
  ThemeProvider,
} from "@mui/material";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Dark theme configuration
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#3b82f6" },
    background: { paper: "#1f2937", default: "#111827" },
    text: { primary: "#f9fafb", secondary: "#d1d5db" },
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: { backgroundColor: "#1f2937", color: "#f9fafb" },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: "#374151",
          color: "#f9fafb",
          borderBottom: "1px solid #4b5563",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { backgroundColor: "#1f2937", color: "#f9fafb" },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { backgroundColor: "#374151", borderTop: "1px solid #4b5563" },
      },
    },
  },
});

const InventoryList = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [open, setOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [currentRow, setCurrentRow] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    fetchInventory();
  }, [paginationModel]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API_URL}/inventory`, {
        params: {
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
        },
      });
      if (res.data.success) {
        const rows = res.data.data.map((item) => ({
          id: item._id,
          assetName: item.assetId?.assetName || "Unknown",
          totalStock: item.totalStock,
          availableStock: item.availableStock,
          issuedStock: item.issuedStock,
          minimumThreshold: item.minimumThreshold,
        }));
        setInventory(rows);
        setRowCount(res.data.total);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
      toast.error(err.response?.data?.msg || "Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (row) => {
    setCurrentRow(row);
    setEditForm({
      totalStock: row.totalStock,
      availableStock: row.availableStock,
      minimumThreshold: row.minimumThreshold,
      reason: "",
      adjustmentQuantity: "",
      description: "",
    });
    setCurrentStep(1);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditForm({});
    setCurrentRow(null);
    setCurrentStep(1);
  };

  const handleReasonSelect = (reason) => {
    setEditForm((prev) => ({
      ...prev,
      reason,
      adjustmentQuantity: "",
      description: "",
    }));
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
    setEditForm((prev) => ({
      ...prev,
      reason: "",
      adjustmentQuantity: "",
      description: "",
    }));
  };

  const getReasonConfig = (reason) => {
    const configs = {
      restock: {
        title: "Add New Stock",
        description: "New assets purchased and added to inventory",
        fieldLabel: "Quantity to Add",
        operation: "add",
        showFields: ["adjustmentQuantity", "minimumThreshold", "description"],
      },
      threshold_update: {
        title: "Update Minimum Threshold",
        description: "Change the minimum stock alert level",
        fieldLabel: "",
        operation: "none",
        showFields: ["minimumThreshold", "description"],
      },
      correction_increase: {
        title: "Correction - Increase Available",
        description: "Found more assets than recorded during audit",
        fieldLabel: "Additional Quantity Found",
        operation: "add",
        showFields: ["adjustmentQuantity", "description"],
      },
      correction_decrease: {
        title: "Correction - Decrease Available",
        description: "Assets missing during physical count",
        fieldLabel: "Missing Quantity",
        operation: "subtract",
        showFields: ["adjustmentQuantity", "description"],
      },
      damage: {
        title: "Asset Write-off",
        description: "Remove damaged, obsolete, or disposed assets",
        fieldLabel: "Quantity to Remove",
        operation: "subtract",
        showFields: ["adjustmentQuantity", "description"],
      },
    };
    return configs[reason] || {};
  };

  // Preview calculation used for UI only
  const calculateNewValues = () => {
    if (!editForm.reason || !currentRow) return null;

    const config = getReasonConfig(editForm.reason);
    const adjustment = Number(editForm.adjustmentQuantity) || 0;

    let newTotal = currentRow.totalStock;
    let newAvailable = currentRow.availableStock;

    // respect explicit minimumThreshold only when user provided a value (not empty string)
    const newMinThreshold =
      editForm.minimumThreshold !== undefined &&
      editForm.minimumThreshold !== ""
        ? Number(editForm.minimumThreshold)
        : currentRow.minimumThreshold;

    if (config.operation === "add") {
      if (editForm.reason === "restock") {
        newTotal = currentRow.totalStock + adjustment;
        newAvailable = currentRow.availableStock + adjustment;
      } else if (editForm.reason === "correction_increase") {
        newAvailable = currentRow.availableStock + adjustment;
      }
    } else if (config.operation === "subtract") {
      if (editForm.reason === "damage") {
        newTotal = Math.max(0, currentRow.totalStock - adjustment);
        newAvailable = Math.max(0, currentRow.availableStock - adjustment);
      } else if (editForm.reason === "correction_decrease") {
        newAvailable = Math.max(0, currentRow.availableStock - adjustment);
      }
    }

    const newIssued = newTotal - newAvailable;

    return {
      totalStock: newTotal,
      availableStock: newAvailable,
      issuedStock: newIssued,
      minimumThreshold: newMinThreshold,
    };
  };

  // Form validation for enabling Save
  const isFormValid = () => {
    if (!editForm.reason) return false;
    const cfg = getReasonConfig(editForm.reason);

    if (cfg.operation !== "none") {
      if (
        !editForm.adjustmentQuantity ||
        Number(editForm.adjustmentQuantity) <= 0
      )
        return false;
    }

    if (
      editForm.minimumThreshold !== undefined &&
      editForm.minimumThreshold !== ""
    ) {
      if (Number(editForm.minimumThreshold) < 0) return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!isFormValid()) return;

    try {
      // const locationId = await api.get(`${API_URL}/general/${user.sapId}`)
      await api.put(`${API_URL}/inventory/update-inventory/${currentRow.id}`, {
        // only send threshold when user provided something
        ...(editForm.minimumThreshold !== undefined &&
        editForm.minimumThreshold !== ""
          ? { minimumThreshold: Number(editForm.minimumThreshold) }
          : {}),
        reason: editForm.reason,
        adjustmentQuantity: Number(editForm.adjustmentQuantity) || 0,
        description: editForm.description?.trim() || "",
      });

      toast.success("Inventory updated successfully");
      handleClose();
      fetchInventory();
    } catch (err) {
      console.error("Error saving inventory:", err);
      toast.error(err.response?.data?.msg || "Update failed");
    }
  };

  const columns = [
    { field: "assetName", headerName: "Asset Name", width: 200 },
    { field: "totalStock", headerName: "Total Stock", width: 120 },
    { field: "availableStock", headerName: "Available", width: 120 },
    { field: "issuedStock", headerName: "Issued", width: 120 },
    { field: "minimumThreshold", headerName: "Min Threshold", width: 150 },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <Button
          size="small"
          onClick={() => handleOpen(params.row)}
          variant="outlined"
          startIcon={<Edit size={16} />}
        >
          Edit
        </Button>
      ),
    },
  ];

  const renderStepOne = () => (
    <>
      <DialogTitle>Select Action Type</DialogTitle>
      <DialogContent>
        <div className="py-4 space-y-3">
          <div
            className="border border-gray-600 rounded-lg p-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleReasonSelect("restock")}
          >
            <h4 className="text-green-400">📦 Add New Stock (Restock)</h4>
            <p className="text-gray-400 text-sm">
              New assets purchased and added to inventory
            </p>
          </div>
          <div
            className="border border-gray-600 rounded-lg p-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleReasonSelect("threshold_update")}
          >
            <h4 className="text-purple-400">⚠️ Update Alert Threshold</h4>
            <p className="text-gray-400 text-sm">
              Change the minimum stock alert level
            </p>
          </div>
          <div
            className="border border-gray-600 rounded-lg p-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleReasonSelect("correction_increase")}
          >
            <h4 className="text-blue-400">📈 Audit Correction (Increase)</h4>
            <p className="text-gray-400 text-sm">
              Found more assets than recorded during audit
            </p>
          </div>
          <div
            className="border border-gray-600 rounded-lg p-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleReasonSelect("correction_decrease")}
          >
            <h4 className="text-orange-400">📉 Audit Correction (Decrease)</h4>
            <p className="text-gray-400 text-sm">
              Assets missing during physical count
            </p>
          </div>
          <div
            className="border border-gray-600 rounded-lg p-4 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleReasonSelect("damage")}
          >
            <h4 className="text-red-400">🗑️ Asset Write-off</h4>
            <p className="text-gray-400 text-sm">
              Remove damaged, obsolete, or disposed assets
            </p>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} sx={{ color: "gray.400" }}>
          Cancel
        </Button>
      </DialogActions>
    </>
  );

  const renderStepTwo = () => {
    const config = getReasonConfig(editForm.reason);
    const preview = calculateNewValues();

    return (
      <>
        <DialogTitle>{config.title}</DialogTitle>
        <DialogContent>
          <div className="py-4 space-y-6">
            <div className="bg-blue-900/50 border border-blue-700 p-4 rounded-lg">
              <p className="text-blue-200 text-sm">{config.description}</p>
              <p className="text-gray-400 text-xs mt-2">
                Asset:{" "}
                <strong className="text-blue-400">
                  {currentRow?.assetName}
                </strong>
              </p>
            </div>

            {/* Current Status */}
            <div className="bg-gray-800 border border-gray-600 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-3 text-gray-200">
                Current Status:
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-gray-400">Total</div>
                  <div className="text-white font-semibold text-lg">
                    {currentRow?.totalStock}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">Available</div>
                  <div className="text-green-400 font-semibold text-lg">
                    {currentRow?.availableStock}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">Issued</div>
                  <div className="text-orange-400 font-semibold text-lg">
                    {currentRow
                      ? currentRow.totalStock - currentRow.availableStock
                      : "-"}
                  </div>
                </div>
              </div>
            </div>

            {config.showFields?.includes("adjustmentQuantity") && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  {config.fieldLabel} <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={editForm.adjustmentQuantity}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      adjustmentQuantity: e.target.value,
                    }))
                  }
                  placeholder={config.fieldLabel}
                  className="w-full rounded-md border border-gray-600 bg-gray-800 text-gray-100 p-2"
                />
              </div>
            )}

            {config.showFields?.includes("minimumThreshold") && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  Minimum Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.minimumThreshold}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      minimumThreshold: e.target.value,
                    }))
                  }
                  placeholder="Minimum Threshold"
                  className="w-full rounded-md border border-gray-600 bg-gray-800 text-gray-100 p-2"
                />
              </div>
            )}

            {config.showFields?.includes("description") && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  Description/Notes (Optional)
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Provide additional details about this inventory adjustment (optional)..."
                  className="w-full rounded-md border border-gray-600 bg-gray-800 text-gray-100 p-2 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {editForm.description?.length || 0}/500 characters
                </div>
              </div>
            )}

            {/* Preview Section */}
            {preview && (
              <div className="bg-gray-800 border border-gray-600 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-3 text-gray-200">
                  Preview After Update:
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-400">Total</div>
                    <div className="text-white font-semibold text-lg">
                      {preview.totalStock}
                      {preview.totalStock !== currentRow?.totalStock && (
                        <span
                          className={`text-xs ml-1 ${
                            preview.totalStock > currentRow?.totalStock
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          (
                          {preview.totalStock > currentRow?.totalStock
                            ? "+"
                            : ""}
                          {preview.totalStock - currentRow?.totalStock})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">Available</div>
                    <div className="text-green-400 font-semibold text-lg">
                      {preview.availableStock}
                      {preview.availableStock !==
                        currentRow?.availableStock && (
                        <span
                          className={`text-xs ml-1 ${
                            preview.availableStock > currentRow?.availableStock
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          (
                          {preview.availableStock > currentRow?.availableStock
                            ? "+"
                            : ""}
                          {preview.availableStock - currentRow?.availableStock})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">Issued</div>
                    <div className="text-orange-400 font-semibold text-lg">
                      {preview.issuedStock}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBack} sx={{ color: "gray.400" }}>
            Back
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={!isFormValid()}
          >
            Save
          </Button>
        </DialogActions>
      </>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="p-6 bg-gray-900 min-h-screen">
        <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-100">
              Inventory Management
            </h3>
          </div>

          <div className="p-6">
            <div style={{ height: 500, width: "100%" }}>
              <DataGrid
                rows={inventory}
                columns={columns}
                rowCount={rowCount}
                loading={loading}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                pageSizeOptions={[5, 10, 25]}
                disableRowSelectionOnClick
                disableSelectionOnClick
              />
            </div>
          </div>
        </div>

        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          {currentStep === 1 ? renderStepOne() : renderStepTwo()}
        </Dialog>
      </div>
    </ThemeProvider>
  );
};

export default InventoryList;
