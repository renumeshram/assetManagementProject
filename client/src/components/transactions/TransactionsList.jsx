import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { mockTransactions } from "../../data/mockData";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { ArrowLeft, Package } from "lucide-react";
import api from "../../utils/api";
import ReturnAsset from "./ReturnAsset";
const API_URL = import.meta.env.VITE_API_BASE_URL;

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#111827", // gray-900
      paper: "#1f2937", // gray-800
    },
    text: {
      primary: "#f9fafb", // gray-50
      secondary: "#d1d5db", // gray-300
    },
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: "#1f2937", // gray-800
          border: "1px solid #374151", // gray-700
          color: "#f9fafb", // gray-50
          "& .MuiDataGrid-cell": {
            borderBottomColor: "#374151", // gray-700
            color: "#f9fafb", // gray-50
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#374151", // gray-700
            borderBottomColor: "#4b5563", // gray-600
            color: "#f9fafb", // gray-50
          },
          "& .MuiDataGrid-columnHeader": {
            color: "#f9fafb", // gray-50
          },
          "& .MuiDataGrid-row": {
            borderBottomColor: "#374151", // gray-700
            "&:hover": {
              backgroundColor: "#374151", // gray-700
            },
          },
          "& .MuiDataGrid-footerContainer": {
            backgroundColor: "#374151", // gray-700
            borderTopColor: "#4b5563", // gray-600
            color: "#f9fafb", // gray-50
          },
          "& .MuiTablePagination-root": {
            color: "#f9fafb", // gray-50
          },
          "& .MuiIconButton-root": {
            color: "#d1d5db", // gray-300
          },
          "& .MuiSelect-root": {
            color: "#f9fafb", // gray-50
          },
          "& .MuiDataGrid-selectedRowCount": {
            color: "#f9fafb", // gray-50
          },
        },
      },
    },
  },
});

const TransactionsList = () => {
  const [transactions, setTransactions] = useState([]);
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("list"); // "list" or "return"

  // pagination state
  const [page, setPage] = useState(0); // DataGrid uses 0-based
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await api.get(`${API_URL}/transaction/all`, {
          params: { page: page + 1, limit: pageSize }, // backend expects 1-based
        });

        const mapped = response.data.transactions.map((transac) => ({
          ...transac,
          id: transac._id,
          assetName: transac.assetId?.assetName || "N/A",
          issuedTo: transac.issuedTo?.sapId || "N/A",
          type: transac.transactionType,
          quantity: transac.quantity,
          issueDate: new Date(transac.issueDate).toLocaleDateString("en-GB"),
          returnDate: transac.returnDate
            ? new Date(transac.returnDate).toLocaleDateString("en-GB")
            : "N/A",
        }));

        setTransactions(mapped);
        setRowCount(response.data.total); // from backend
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [page, pageSize, transactionFilter]); // refetch on pagination/filter change

  const filteredTransactions = transactions.filter(
    (t) => transactionFilter === "all" || t.transactionType === transactionFilter
  );

  const columns = [
    {
      field: "serial",
      headerName: "S.No",
      width: 80,
      sortable: false,
      renderCell: (params) => {
        const rowIndex = params.api.getRowIndexRelativeToVisibleRows(params.id);
        return page * pageSize + (rowIndex + 1);
      },
    },
    { field: "assetName", headerName: "Asset", width: 200 },
    { field: "issuedTo", headerName: "Issued To", width: 150 },
    {
      field: "transactionType",
      headerName: "Type",
      width: 100,
      renderCell: (params) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            params.value === "issue"
              ? "bg-blue-900 text-blue-200"
              : "bg-green-900 text-green-200"
          }`}
        >
          {params.value?.toUpperCase()}
        </span>
      ),
    },
    { field: "quantity", headerName: "Qty", width: 70 },
    { field: "issueDate", headerName: "Issue Date", width: 110 },
    // { field: "returnDate", headerName: "Return Date", width: 110 },
    // {
    //   field: "status",
    //   headerName: "Status",
    //   width: 100,
    //   renderCell: (params) => {
    //     const value = params.value || "N/A";
    //     return (
    //       <span
    //         className={`px-2 py-1 rounded-full text-xs font-medium ${
    //           params.value === "active"
    //             ? "bg-yellow-900 text-yellow-200"
    //             : "bg-gray-700 text-gray-300"
    //         }`}
    //       >
    //         {value.toString().toUpperCase()}
    //       </span>
    //     );
    //   },
    // },
  ];

  // If showing return asset form, render that instead
  // if (currentView === "return") {
  //   return (
  //     <div className="min-h-screen bg-gray-900">
  //       <div className="p-6">
  //         <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6 mb-6">
  //           <div className="flex items-center justify-between">
  //             <div className="flex items-center">
  //               <button
  //                 onClick={() => setCurrentView("list")}
  //                 className="flex items-center text-gray-400 hover:text-white transition-colors mr-4"
  //               >
  //                 <ArrowLeft className="w-5 h-5 mr-2" />
  //                 Back to Transactions
  //               </button>
  //               <h3 className="text-lg font-semibold text-gray-100">
  //                 Return Asset
  //               </h3>
  //             </div>
  //           </div>
  //         </div>
  //         <ReturnAsset />
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="p-6 min-h-screen bg-gray-900">
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-100">
                Asset Transactions
              </h3>
              <div className="flex items-center space-x-4">
                {/* <button
                  onClick={() => setCurrentView("return")}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Return Asset
                </button> */}
                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-600 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="issue">Issue</option>
                  <option value="return">Return</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div style={{ height: 400, width: "100%" }}>
              <DataGrid
                rows={filteredTransactions}
                columns={columns}
                loading={loading}
                rowCount={rowCount}
                pagination
                paginationMode="server"
                pageSizeOptions={[5, 10, 25]}
                paginationModel={{ page, pageSize }}
                onPaginationModelChange={(model) => {
                  setPage(model.page);
                  setPageSize(model.pageSize);
                }}
                disableRowSelectionOnClick
              />
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};


export default TransactionsList;
