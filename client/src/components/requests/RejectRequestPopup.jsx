// RejectRequestPopup.jsx
import React, { useState } from "react";
import { X, XCircle, AlertTriangle } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RejectRequestPopup = ({ isOpen, onClose, request, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post(`${API_URL}/request/reject/${request.id}`, {
        status: "rejected",
        rejectionReason: rejectionReason.trim()
      });

      if (response.data.success) {
        toast.success("Request rejected successfully");
        onSuccess(request.id, 'rejected');
        onClose();
        setRejectionReason(""); // Reset form
      } else {
        toast.error(response.data.msg || "Failed to reject request");
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to reject request");
      console.error("Error rejecting request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRejectionReason("");
    onClose();
  };

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center">
            <XCircle className="w-5 h-5 mr-2 text-red-400" />
            Reject Request
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning */}
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-red-400 font-medium mb-1">Confirm Rejection</h4>
              <p className="text-red-300 text-sm">
                Are you sure you want to reject this request? This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Request Summary */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-200">Request Summary</h4>
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
                <span className="text-gray-400">Quantity:</span>
                <span className="text-gray-200">{request.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Department:</span>
                <span className="text-gray-200">{request.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Section:</span>
                <span className="text-gray-200">{request.section}</span>
              </div>
            </div>
          </div>

          {/* Rejection Reason */}
          <div className="space-y-3">
            <label htmlFor="rejectionReason" className="block font-medium text-gray-200">
              Rejection Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a clear reason for rejecting this request..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              disabled={loading}
            />
            <p className="text-gray-400 text-sm">
              This reason will be visible to the requestor and will be saved for audit purposes.
            </p>
          </div>

          {/* Common Rejection Reasons (Optional Quick Select) */}
          <div className="space-y-2">
            <p className="text-gray-300 text-sm font-medium">Quick reasons:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Out of stock",
                "Budget constraints", 
                "Incorrect item requested",
                "Current item still functional",
                "Request not justified"
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectionReason(reason)}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
                  disabled={loading}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-white bg-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={loading || !rejectionReason.trim()}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center cursor-pointer ${
              loading || !rejectionReason.trim()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Reject Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectRequestPopup;