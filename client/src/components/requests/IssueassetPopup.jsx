// IssueAssetPopup.jsx
import React, { useState, useEffect } from "react";
import { X, Package, AlertCircle } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const IssueAssetPopup = ({ isOpen, onClose, request, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [inventoryInfo, setInventoryInfo] = useState(null);
  const [ewasteReceived, setEwasteReceived] = useState(false);
  const [fetchingInventory, setFetchingInventory] = useState(true);
  const [ewasteQuantity, setEwasteQuantity] = useState(0);

  useEffect(() => {
    if (isOpen && request) {
      fetchInventoryInfo();
    }
  }, [isOpen, request]);

  const fetchInventoryInfo = async () => {
    try {
      setFetchingInventory(true);
      const response = await api.get(
        `${API_URL}/inventory/asset/${request.assetId._id || request.assetId}`
      );
      setInventoryInfo(response.data.inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to fetch inventory information");
    } finally {
      setFetchingInventory(false);
    }
  };

  const handleIssue = async () => {
    try {
      setLoading(true);
      //debugging logs
      console.log("Sending payload:", {
        ewasteReceived,
        ewasteQuantity: ewasteReceived ? ewasteQuantity : 0,
      });

      const response = await api.post(
        `${API_URL}/transaction/issue/${request.id}`,
        {
          ewasteReceived: ewasteReceived,
          ewasteQuantity: ewasteReceived ? ewasteQuantity : 0,
        }
      );

      if (response.data.success) {
        toast.success("Asset issued successfully");
        onSuccess(request.id, "issued");
        onClose();
      } else {
        toast.error(response.data.msg || "Failed to issue asset");
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to issue asset");
      console.error("Error issuing asset:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  const isStockSufficient =
    inventoryInfo && inventoryInfo.availableStock >= request.quantity;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-400" />
            Issue Asset
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Request Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-200">Request Details</h4>
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Requestor:</span>
                <span className="text-gray-200">{request.sapId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Asset:</span>
                <span className="text-gray-200">{request.assetName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Department:</span>
                <span className="text-gray-200">{request.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Section:</span>
                <span className="text-gray-200">{request.section}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quantity:</span>
                <span className="text-gray-200">{request.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Request Date:</span>
                <span className="text-gray-200">{request.requestDate}</span>
              </div>
            </div>
          </div>

          {/* Inventory Status */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-200">Availability Check</h4>
            <div className="bg-gray-900 rounded-lg p-4">
              {fetchingInventory ? (
                <div className="flex items-center text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                  Checking availability...
                </div>
              ) : inventoryInfo ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Available Stock:</span>
                    <span
                      className={`font-medium ${
                        isStockSufficient ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {inventoryInfo.availableStock}
                    </span>
                  </div>
                  {/* <div className="flex justify-between">
                    <span className="text-gray-400">Total Stock:</span>
                    <span className="text-gray-200">
                      {inventoryInfo.totalStock}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Issued Stock:</span>
                    <span className="text-gray-200">
                      {inventoryInfo.issuedStock}
                    </span>
                  </div> */}
                  {!isStockSufficient && (
                    <div className="flex items-center text-red-400 text-sm mt-2">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Insufficient stock available
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Unable to fetch inventory information
                </div>
              )}
            </div>
          </div>

          {/* E-waste Collection Question */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-200">E-waste Collection</h4>
            <div className="bg-gray-900 rounded-lg p-4 space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ewasteReceived}
                  onChange={(e) => setEwasteReceived(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-gray-200">Old cartridge received</span>
              </label>
              {ewasteReceived && (
                <div>
                  <input
                    type="number"
                    min="0"
                    max={request.quantity}
                    value={ewasteQuantity || ""}
                    onChange={(e) => setEwasteQuantity(Number(e.target.value))}
                    className="mt-2 w-full p-2 rounded bg-gray-800 border border-gray-600 text-gray-200"
                    placeholder="Enter returned quantity"
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Specify how many old cartridges were returned (max:{" "}
                    {request.quantity})
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleIssue}
            disabled={loading || !isStockSufficient || fetchingInventory}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
              loading || !isStockSufficient || fetchingInventory
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Issuing...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Issue Asset
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueAssetPopup;
