export const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@company.com', sapId: 'SAP001', role: 'user', department: 'IT', section: 'Development' },
  { id: '2', name: 'Jane Smith', email: 'jane@company.com', sapId: 'SAP002', role: 'manager', department: 'HR', section: 'Recruitment' },
  { id: '3', name: 'Admin User', email: 'admin@company.com', sapId: 'SAP003', role: 'admin', department: 'IT', section: 'Administration' }
];

export const mockDepartments = [
  { id: '1', name: 'Information Technology' },
  { id: '2', name: 'Human Resources' },
  { id: '3', name: 'Finance' }
];

export const mockSections = [
  { id: '1', name: 'Development', departmentId: '1' },
  { id: '2', name: 'Support', departmentId: '1' },
  { id: '3', name: 'Recruitment', departmentId: '2' }
];

export const mockCategories = [
  { id: '1', name: 'Laptops' },
  { id: '2', name: 'Mobile Phones' },
  { id: '3', name: 'Monitors' }
];

export const mockAssets = [
  { id: '1', name: 'Dell Laptop XPS 13', categoryId: '1', make: 'Dell', model: 'XPS 13' },
  { id: '2', name: 'iPhone 14', categoryId: '2', make: 'Apple', model: 'iPhone 14' },
  { id: '3', name: 'Samsung Monitor', categoryId: '3', make: 'Samsung', model: '27" 4K' }
];

export const mockRequests = [
  { 
    id: '1', 
    requestorName: 'John Doe',
    departmentName: 'IT',
    sectionName: 'Development',
    categoryName: 'Laptops',
    assetName: 'Dell Laptop XPS 13',
    quantity: 1,
    status: 'pending',
    requestDate: '2024-01-15',
    comments: 'Need for new project'
  },
  { 
    id: '2', 
    requestorName: 'Jane Smith',
    departmentName: 'HR', 
    sectionName: 'Recruitment',
    categoryName: 'Mobile Phones',
    assetName: 'iPhone 14',
    quantity: 2,
    status: 'approved',
    requestDate: '2024-01-14',
    comments: 'For new employees'
  }
];

export const mockTransactions = [
  {
    id: '1',
    assetName: 'Dell Laptop XPS 13',
    issuedTo: 'John Doe (SAP001)',
    transactionType: 'issue',
    quantity: 1,
    issueDate: '2024-01-10',
    returnDate: null,
    status: 'active'
  },
  {
    id: '2',
    assetName: 'iPhone 14',
    issuedTo: 'Jane Smith (SAP002)',
    transactionType: 'return',
    quantity: 1,
    issueDate: '2024-01-05',
    returnDate: '2024-01-12',
    status: 'returned'
  }
];

export const mockInventory = [
  { id: '1', assetName: 'Dell Laptop XPS 13', totalStock: 50, availableStock: 30, issuedStock: 20, minimumThreshold: 10 },
  { id: '2', assetName: 'iPhone 14', totalStock: 25, availableStock: 15, issuedStock: 10, minimumThreshold: 5 },
  { id: '3', assetName: 'Samsung Monitor', totalStock: 40, availableStock: 35, issuedStock: 5, minimumThreshold: 8 }
];