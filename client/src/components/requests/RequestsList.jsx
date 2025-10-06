// import React, { useEffect, useState } from 'react';
// import { DataGrid } from '@mui/x-data-grid';
// import { CheckCircle, XCircle, Package } from 'lucide-react';
// import { useAuth } from '../../hooks/useAuth';
// import { mockRequests } from '../../data/mockData';
// import api from '../../utils/api';
// import request from '../../../../server/models/request';
// const API_URL = import.meta.env.VITE_API_BASE_URL;

// const RequestsList = () => {
//   const { user } = useAuth();
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [requests, setRequests] = useState([]);
//   const  [loading, setLoading] = useState(true);

//   // Fetch data from backend
//   useEffect(() =>{
//     const fetchRequests = async()=>{
//       try{
//         const response = await api.get(`${API_URL}/request/my-requests`);

//          // Map _id -> id and flatten assetName
//       const mapped = response.data.map(req => ({
//         ...req,
//         id: req._id, 
//         assetName: req.assetId?.assetName || 'N/A' 
//       }));
//         setRequests(mapped);
//         console.log('req',requests)
//       }catch(error){
//         console.error('Error fetching requests:', error);
//       }finally{
//         setLoading(false);
//       }
//     }

//     fetchRequests();
//   }, []);

//   const handleStatusChange = async(requestId, newStatus) => {
//     try{

//       //Update backend
//       await api.patch(`${API_URL}/requests/${requestId}`, { status: newStatus });
  
//        // Update frontend state
//         setRequests(prev => 
//           prev.map(req => 
//             req.id === requestId ? { ...req, status: newStatus } : req
//           )
//         );
//     }catch(error) {
//       console.error('Error updating request status:', error);
//     }
//   };

//   const columns = [
//     // { field: 'id', headerName: 'ID', width: 80 },
//     // { field: 'requestorName', headerName: 'Requestor', width: 150 },
//     { field: 'assetName', headerName: 'Asset', width: 200,},
//     { field: 'quantity', headerName: 'Qty', width: 70 },
//     { 
//       field: 'status', 
//       headerName: 'Status', 
//       width: 130,
//       renderCell: (params) => (
//         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//           params.value === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
//           params.value === 'approved' ? 'bg-green-900/50 text-green-300' :
//           params.value === 'issued' ? 'bg-blue-900/50 text-blue-300' :
//           'bg-red-900/50 text-red-300'
//         }`}>
//           {params.value.toUpperCase()}
//         </span>
//       )
//     },
//     { field: 'requestDate', headerName: 'Date', width: 110 },
//     { field: 'comments', headerName: 'Comments', width: 150 }
//   ];

//   if (user.role === 'manager' || user.role === 'admin') {
//     columns.push({
//       field: 'actions',
//       headerName: 'Actions',
//       width: 180,
//       renderCell: (params) => (
//         <div className="flex space-x-1">
//           <button 
//             onClick={() => handleStatusChange(params.row.id, 'approved')}
//             className="p-1 text-green-400 hover:bg-green-900/50 rounded"
//             title="Approve"
//           >
//             <CheckCircle className="w-4 h-4" />
//           </button>
//           <button 
//             onClick={() => handleStatusChange(params.row.id, 'rejected')}
//             className="p-1 text-red-400 hover:bg-red-900/50 rounded"
//             title="Reject"
//           >
//             <XCircle className="w-4 h-4" />
//           </button>
//           <button 
//             onClick={() => handleStatusChange(params.row.id, 'issued')}
//             className="p-1 text-blue-400 hover:bg-blue-900/50 rounded"
//             title="Issue"
//           >
//             <Package className="w-4 h-4" />
//           </button>
//         </div>
//       )
//     });
//   }

//   const filteredRequests = requests.filter(req => 
//     statusFilter === 'all' || req.status === statusFilter
//   );

//   return (
//     <div className="p-6 bg-gray-900 min-h-screen">
//       <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
//         <div className="p-6 border-b border-gray-700">
//           <div className="flex justify-between items-center">
//             <h3 className="text-lg font-semibold text-gray-100">
//               {user.role === 'user' ? 'My Requests' : 'All Requests'}
//             </h3>
//             <div className="flex items-center space-x-4">
//               <select
//                 value={statusFilter}
//                 onChange={(e) => setStatusFilter(e.target.value)}
//                 className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               >
//                 <option value="all">All Status</option>
//                 <option value="pending">Pending</option>
//                 <option value="approved">Approved</option>
//                 <option value="issued">Issued</option>
//                 <option value="rejected">Rejected</option>
//               </select>
//             </div>
//           </div>
//         </div>
        
//         <div className="p-6">
//           <div style={{ height: 400, width: '100%' }}>
//             <DataGrid
//               rows={filteredRequests}
//               columns={columns}
//               pageSize={10}
//               loading={loading}
//               rowsPerPageOptions={[5, 10, 25]}
//               disableSelectionOnClick
//               className="text-gray-200"
//               sx={{
//                 '& .MuiDataGrid-root': { border: 'none', color: '#E5E7EB' },
//                 '& .MuiDataGrid-cell': { borderBottom: '1px solid #374151' },
//                 '& .MuiDataGrid-columnHeaders': { 
//                   backgroundColor: '#1F2937',
//                   color: '#F9FAF',
//                   borderBottom: '1px solid #374151'
//                 },
//                 '& .MuiDataGrid-footerContainer': {
//                   backgroundColor: '#1F2937',
//                   color: '#F3F4F6',
//                   borderTop: '1px solid #374151'
//                 },
//                 '& .MuiDataGrid-row': {
//                   '&:hover': { backgroundColor: '#374151' },
//                 },
//                 '& .MuiTablePagination-root': {
//                   color: '#D1D5DB',
//                 },
//                 '& .MuiSelect-icon': {
//                   color: '#D1D5DB',
//                 },
//               }}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RequestsList;

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AllRequestsList from './AllRequestList';
import MyRequestList from './MyRequestList';

const RequestsList = () => {
  const { user } = useAuth();

  if(user.role === 'manager' || user.role === 'admin' || user.role === 'superAdmin') {
    return <AllRequestsList />;
  }

  return <MyRequestList />;
}

export default RequestsList;