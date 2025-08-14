import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { mockTransactions } from '../../data/mockData';

const TransactionsList = () => {
  const [transactionFilter, setTransactionFilter] = useState('all');

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'assetName', headerName: 'Asset', width: 200 },
    { field: 'issuedTo', headerName: 'Issued To', width: 150 },
    { field: 'transactionType', headerName: 'Type', width: 100,
      renderCell: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          params.value === 'issue' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {params.value.toUpperCase()}
        </span>
      )
    },
    { field: 'quantity', headerName: 'Qty', width: 70 },
    { field: 'issueDate', headerName: 'Issue Date', width: 110 },
    { field: 'returnDate', headerName: 'Return Date', width: 110 },
    { field: 'status', headerName: 'Status', width: 100,
      renderCell: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          params.value === 'active' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {params.value.toUpperCase()}
        </span>
      )
    }
  ];

  const filteredTransactions = mockTransactions.filter(trans => 
    transactionFilter === 'all' || trans.transactionType === transactionFilter
  );

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Asset Transactions</h3>
            <div className="flex items-center space-x-4">
              <select
                value={transactionFilter}
                onChange={(e) => setTransactionFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="issue">Issue</option>
                <option value="return">Return</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div style={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={filteredTransactions}
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

export default TransactionsList;