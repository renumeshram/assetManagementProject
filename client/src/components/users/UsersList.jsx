import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { mockUsers } from '../../data/mockData';

const UsersList = () => {
  const [users, setUsers] = useState(mockUsers);
  const [roleFilter, setRoleFilter] = useState('all');

  const handleRoleChange = (userId, newRole) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'sapId', headerName: 'SAP ID', width: 100 },
    { field: 'department', headerName: 'Department', width: 150 },
    { field: 'section', headerName: 'Section', width: 120 },
    { 
      field: 'role', 
      headerName: 'Role', 
      width: 120,
      renderCell: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          params.value === 'admin' ? 'bg-red-100 text-red-800' :
          params.value === 'manager' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {params.value.toUpperCase()}
        </span>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <select
          value={params.row.role}
          onChange={(e) => handleRoleChange(params.row.id, e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      )
    }
  ];

  const filteredUsers = users.filter(user => 
    roleFilter === 'all' || user.role === roleFilter
  );

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Users Management</h3>
            <div className="flex items-center space-x-4">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div style={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={filteredUsers}
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

export default UsersList;