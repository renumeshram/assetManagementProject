// import React, { useState } from 'react';

// const Reports = () => {
//   const [reportType, setReportType] = useState('requests');

//   const requestsReport = {
//     title: 'Requests Summary',
//     data: [
//       { label: 'Total Requests', value: 45, color: 'bg-blue-100 text-blue-800' },
//       { label: 'Pending', value: 12, color: 'bg-yellow-100 text-yellow-800' },
//       { label: 'Approved', value: 18, color: 'bg-green-100 text-green-800' },
//       { label: 'Issued', value: 10, color: 'bg-purple-100 text-purple-800' },
//       { label: 'Rejected', value: 5, color: 'bg-red-100 text-red-800' }
//     ]
//   };

//   const inventoryReport = {
//     title: 'Inventory Summary',
//     data: [
//       { label: 'Total Assets', value: 340, color: 'bg-blue-100 text-blue-800' },
//       { label: 'Available', value: 210, color: 'bg-green-100 text-green-800' },
//       { label: 'Issued', value: 120, color: 'bg-yellow-100 text-yellow-800' },
//       { label: 'Low Stock Items', value: 8, color: 'bg-red-100 text-red-800' },
//       { label: 'Out of Stock', value: 2, color: 'bg-gray-100 text-gray-800' }
//     ]
//   };

//   const getCurrentReport = () => {
//     return reportType === 'requests' ? requestsReport : inventoryReport;
//   };

//   return (
//     <div className="p-6">
//       <div className="bg-white rounded-xl shadow-sm border border-gray-100">
//         <div className="p-6 border-b border-gray-200">
//           <div className="flex justify-between items-center">
//             <h3 className="text-lg font-semibold text-gray-800">Reports</h3>
//             <div className="flex items-center space-x-4">
//               <select
//                 value={reportType}
//                 onChange={(e) => setReportType(e.target.value)}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               >
//                 <option value="requests">Requests Report</option>
//                 <option value="inventory">Inventory Report</option>
//               </select>
//               <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
//                 Export PDF
//               </button>
//             </div>
//           </div>
//         </div>
        
//         <div className="p-6">
//           <div className="mb-6">
//             <h4 className="text-lg font-medium text-gray-800 mb-4">{getCurrentReport().title}</h4>
//             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
//               {getCurrentReport().data.map((item, index) => (
//                 <div key={index} className="bg-gray-50 rounded-lg p-4">
//                   <p className="text-sm text-gray-600 mb-2">{item.label}</p>
//                   <div className="flex items-center justify-between">
//                     <p className="text-2xl font-bold text-gray-800">{item.value}</p>
//                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.color}`}>
//                       {item.value}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="bg-gray-50 rounded-lg p-6">
//             <h5 className="text-md font-medium text-gray-800 mb-4">Recent Activity</h5>
//             <div className="space-y-3">
//               <div className="flex items-center justify-between p-3 bg-white rounded">
//                 <span className="text-gray-700">John Doe requested Dell Laptop XPS 13</span>
//                 <span className="text-sm text-gray-500">2 hours ago</span>
//               </div>
//               <div className="flex items-center justify-between p-3 bg-white rounded">
//                 <span className="text-gray-700">Jane Smith approved iPhone 14 request</span>
//                 <span className="text-sm text-gray-500">4 hours ago</span>
//               </div>
//               <div className="flex items-center justify-between p-3 bg-white rounded">
//                 <span className="text-gray-700">Samsung Monitor issued to IT Department</span>
//                 <span className="text-sm text-gray-500">1 day ago</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Reports;