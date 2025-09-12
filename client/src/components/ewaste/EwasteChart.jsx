// // components/EwasteChart.jsx
// import React, { useState, useEffect } from "react";
// import {
//   LineChart,
//   Line,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";

// const API_URL = import.meta.env.VITE_API_BASE_URL;

// const EwasteChart = ({ filters = {}, departments = [] }) => {
//   const [chartData, setChartData] = useState([]);
//   const [chartType, setChartType] = useState("line");
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (filters && filters.year) {
//       fetchChartData();
//     }
//   }, [filters]);

//   const fetchChartData = async () => {
//     if (!filters || !filters.year) return; // guard if no filters selected
//     setLoading(true);
//     try {
//       const queryParams = new URLSearchParams({
//         period: filters.period === "custom" ? "month" : filters.period || "year",
//         year: filters.year || new Date().getFullYear(),
//         ...(filters.departmentId && { departmentId: filters.departmentId }),
//       });

//       const response = await fetch(
//         `${API_URL}/reports/ewaste/chart-data?${queryParams}`
//       );
//       const data = await response.json();

//       if (data.success) {
//         const processedData = processChartData(data.data, filters.period);
//         setChartData(processedData);
//       }
//     } catch (error) {
//       console.error("Error fetching chart data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const processChartData = (rawData, period) => {
//     const dataMap = new Map();

//     rawData.forEach((item) => {
//       const key =
//         period === "year"
//           ? `${item._id.year}`
//           : `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;

//       if (!dataMap.has(key)) {
//         dataMap.set(key, {
//           period:
//             period === "year"
//               ? `${item._id.year}`
//               : `${new Date(item._id.year, item._id.month - 1).toLocaleDateString(
//                   "en-US",
//                   { year: "numeric", month: "short" }
//                 )}`,
//           generated: 0,
//           collected: 0,
//         });
//       }

//       const entry = dataMap.get(key);
//       if (item._id.transactionType === "issue") {
//         entry.generated = item.totalWeight;
//       } else {
//         entry.collected = item.totalWeight;
//       }
//     });

//     return Array.from(dataMap.values()).sort((a, b) => {
//       if (period === "year") {
//         return parseInt(a.period) - parseInt(b.period);
//       } else {
//         return new Date(a.period) - new Date(b.period);
//       }
//     });
//   };

//   const CustomTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//       return (
//         <div className="bg-gray-800 p-3 border border-gray-700 rounded-lg shadow-lg text-white">
//           <p className="font-semibold">{label}</p>
//           {payload.map((entry, index) => (
//             <p key={index} style={{ color: entry.color }} className="text-sm">
//               {`${entry.name}: ${entry.value.toFixed(2)} kg`}
//             </p>
//           ))}
//         </div>
//       );
//     }
//     return null;
//   };

//   if (loading) {
//     return (
//       <div className="bg-gray-800 p-8 rounded-lg shadow mb-8">
//         <div className="flex justify-center items-center h-64">
//           <p className="text-blue-400 text-lg">Loading chart data...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!filters || !filters.year) {
//     return (
//       <div className="bg-gray-800 p-8 rounded-lg shadow mb-8">
//         <div className="flex justify-center items-center h-64">
//           <p className="text-gray-400 text-lg">
//             Please select a period and year to view chart data.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-gray-800 p-6 rounded-lg shadow mb-8">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
//         <h3 className="text-xl font-semibold text-white mb-4 sm:mb-0">
//           E-waste Trends{" "}
//           {filters.departmentId &&
//             departments.find((d) => d._id === filters.departmentId)?.name &&
//             `- ${
//               departments.find((d) => d._id === filters.departmentId)?.name
//             }`}
//         </h3>
//         <div className="flex space-x-2">
//           <button
//             onClick={() => setChartType("line")}
//             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
//               chartType === "line"
//                 ? "bg-blue-600 text-white"
//                 : "bg-gray-700 text-gray-300 hover:bg-gray-600"
//             }`}
//           >
//             Line Chart
//           </button>
//           <button
//             onClick={() => setChartType("bar")}
//             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
//               chartType === "bar"
//                 ? "bg-blue-600 text-white"
//                 : "bg-gray-700 text-gray-300 hover:bg-gray-600"
//             }`}
//           >
//             Bar Chart
//           </button>
//         </div>
//       </div>

//       {chartData.length > 0 ? (
//         <div className="h-80">
//           <ResponsiveContainer width="100%" height="100%">
//             {chartType === "line" ? (
//               <LineChart
//                 data={chartData}
//                 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//               >
//                 <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
//                 <XAxis dataKey="period" stroke="#9ca3af" fontSize={12} />
//                 <YAxis
//                   stroke="#9ca3af"
//                   fontSize={12}
//                   label={{
//                     value: "Weight (kg)",
//                     angle: -90,
//                     position: "insideLeft",
//                     fill: "#9ca3af",
//                   }}
//                 />
//                 <Tooltip content={<CustomTooltip />} />
//                 <Legend wrapperStyle={{ color: "#fff" }} />
//                 <Line
//                   type="monotone"
//                   dataKey="generated"
//                   stroke="#dc2626"
//                   strokeWidth={3}
//                   name="Generated"
//                   dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
//                   activeDot={{ r: 6, stroke: "#dc2626", strokeWidth: 2 }}
//                 />
//                 <Line
//                   type="monotone"
//                   dataKey="collected"
//                   stroke="#16a34a"
//                   strokeWidth={3}
//                   name="Collected"
//                   dot={{ fill: "#16a34a", strokeWidth: 2, r: 4 }}
//                   activeDot={{ r: 6, stroke: "#16a34a", strokeWidth: 2 }}
//                 />
//               </LineChart>
//             ) : (
//               <BarChart
//                 data={chartData}
//                 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//               >
//                 <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
//                 <XAxis dataKey="period" stroke="#9ca3af" fontSize={12} />
//                 <YAxis
//                   stroke="#9ca3af"
//                   fontSize={12}
//                   label={{
//                     value: "Weight (kg)",
//                     angle: -90,
//                     position: "insideLeft",
//                     fill: "#9ca3af",
//                   }}
//                 />
//                 <Tooltip content={<CustomTooltip />} />
//                 <Legend wrapperStyle={{ color: "#fff" }} />
//                 <Bar
//                   dataKey="generated"
//                   fill="#dc2626"
//                   name="Generated"
//                   radius={[2, 2, 0, 0]}
//                 />
//                 <Bar
//                   dataKey="collected"
//                   fill="#16a34a"
//                   name="Collected"
//                   radius={[2, 2, 0, 0]}
//                 />
//               </BarChart>
//             )}
//           </ResponsiveContainer>
//         </div>
//       ) : (
//         <div className="h-64 flex items-center justify-center text-gray-400">
//           <p>No chart data available for the selected criteria.</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default EwasteChart;
