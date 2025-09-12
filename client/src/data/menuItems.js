import { 
  Users, 
  Package, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus
} from 'lucide-react';

export const getMenuItems = (role) => {
  const menuItems = {
    user: [
      { icon: BarChart3, label: 'Dashboard', view: 'dashboard' },
      { icon: Plus, label: 'New Request', view: 'request' },
      { icon: FileText, label: 'My Requests', view: 'my-requests' }
    ],
    manager: [
      { icon: BarChart3, label: 'Dashboard', view: 'dashboard' },
      { icon: FileText, label: 'All Requests', view: 'requests' },
      { icon: Package, label: 'Transactions', view: 'transactions' },
      { icon: Plus, label: 'Direct Request', view: 'direct-request' },
      { icon: FileText, label: 'Reports', view: 'reports' }
    ],
    admin: [
      { icon: BarChart3, label: 'Dashboard', view: 'dashboard' },
      { icon: Users, label: 'Users', view: 'users' },
      { icon: FileText, label: 'All Requests', view: 'requests' },
      { icon: Package, label: 'Transactions', view: 'transactions' },
      { icon: Plus, label: 'Direct Request', view: 'direct-request' },
      { icon: Settings, label: 'Inventory', view: 'inventory' },
      { icon: Plus, label: 'Add Asset', view: 'add-asset' },
      { icon: FileText, label: 'Reports', view: 'reports' },
      { icon: Plus, label: 'Create Inventory', view: 'create-inventory' }
    ]
  };
  
  return menuItems[role] || [];
};