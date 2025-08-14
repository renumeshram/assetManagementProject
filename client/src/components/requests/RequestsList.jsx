import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { CheckCircle, XCircle, Package } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { mockRequests } from '../../data/mockData';

const RequestsList = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [requests, setRequests] = useState(mockRequests);

  const handleStatusChange = (requestId, newStatus) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: newStatus } : req
    ));
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'requestorName', headerName: 'Requestor', width: 150 },
    { field: 'assetName', headerName: 'Asset', width: 200 },
    { field: 'quantity', headerName: 'Qty', width: 70 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 130,
      renderCell: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          params.value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          params.value === 'approved' ? 'bg-green-100 text-green-800' :
          params.value === 'issued' ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {params.value.toUpperCase()}
        </span>
      )
    },
    { field: 'requestDate', headerName: 'Date', width: 110 },
    { field: 'comments', headerName: 'Comments', width: 150 }
  ];

  if (user.role === 'manager' || user.role === 'admin') {
    columns.push({
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: (params) => (
        <div className="flex space-x-1">
          <button 
            onClick={() => handleStatusChange(params.row.id, 'approved')}
            className="p-1 text-green-600 hover:bg-green-100 rounded"
            title="Approve"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleStatusChange(params.row.id, 'rejected')}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
            title="Reject"
          >
            <XCircle className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleStatusChange(params.row.id, 'issued')}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            title="Issue"
          >
            <Package className="w-4 h-4" />
          </button>
        </div>
      )
    });
  }

  const filteredRequests = requests.filter(req => 
    statusFilter === 'all' || req.status === statusFilter
  );

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              {user.role === 'user' ? 'My Requests' : 'All Requests'}
            </h3>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="issued">Issued</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div style={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={filteredRequests}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 25]}
              disableSelectionOnClick
              className="border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestsList;