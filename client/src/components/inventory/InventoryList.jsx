import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Edit, CheckCircle, XCircle } from 'lucide-react';
import { mockInventory } from '../../data/mockData';

const InventoryList = () => {
  const [inventory, setInventory] = useState(mockInventory);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleEdit = (item) => {
    setEditingItem(item.id);
    setEditForm({
      totalStock: item.totalStock,
      availableStock: item.availableStock,
      minimumThreshold: item.minimumThreshold
    });
  };

  const handleSave = () => {
    setInventory(prev => prev.map(item => 
      item.id === editingItem ? {
        ...item,
        totalStock: parseInt(editForm.totalStock),
        availableStock: parseInt(editForm.availableStock),
        minimumThreshold: parseInt(editForm.minimumThreshold),
        issuedStock: parseInt(editForm.totalStock) - parseInt(editForm.availableStock)
      } : item
    ));
    setEditingItem(null);
    setEditForm({});
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'assetName', headerName: 'Asset Name', width: 200 },
    { 
      field: 'totalStock', 
      headerName: 'Total Stock', 
      width: 120,
      renderCell: (params) => (
        editingItem === params.row.id ? (
          <input
            type="number"
            value={editForm.totalStock}
            onChange={(e) => setEditForm({...editForm, totalStock: e.target.value})}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        ) : params.value
      )
    },
    { 
      field: 'availableStock', 
      headerName: 'Available', 
      width: 100,
      renderCell: (params) => (
        editingItem === params.row.id ? (
          <input
            type="number"
            value={editForm.availableStock}
            onChange={(e) => setEditForm({...editForm, availableStock: e.target.value})}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        ) : (
          <span className={params.value < params.row.minimumThreshold ? 'text-red-600 font-medium' : ''}>
            {params.value}
          </span>
        )
      )
    },
    { field: 'issuedStock', headerName: 'Issued', width: 100 },
    { 
      field: 'minimumThreshold', 
      headerName: 'Min Threshold', 
      width: 120,
      renderCell: (params) => (
        editingItem === params.row.id ? (
          <input
            type="number"
            value={editForm.minimumThreshold}
            onChange={(e) => setEditForm({...editForm, minimumThreshold: e.target.value})}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        ) : params.value
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <div className="flex space-x-1">
          {editingItem === params.row.id ? (
            <>
              <button
                onClick={handleSave}
                className="p-1 text-green-600 hover:bg-green-100 rounded"
                title="Save"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => {setEditingItem(null); setEditForm({});}}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
                title="Cancel"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => handleEdit(params.row)}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Inventory Management</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-sm text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span>Low Stock Alert</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div style={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={inventory}
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

export default InventoryList;