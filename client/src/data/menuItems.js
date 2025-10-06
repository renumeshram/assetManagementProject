import { 
  Users, 
  Package, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus,
  Key,
  Globe,
  Building,
} from 'lucide-react';

export const getMenuItems = (role) => {
  const menuItems = {
    user: [
      { icon: BarChart3, label: 'Dashboard', view: 'dashboard' },
      { icon: Plus, label: 'New Request', view: 'request' },
      { icon: FileText, label: 'My Requests', view: 'my-requests' },
      { icon: Key, label: 'Change Password', view: 'change-password' }
    ],
    manager: [
      { icon: BarChart3, label: 'Dashboard', view: 'dashboard' },
      { icon: FileText, label: 'All Requests', view: 'requests' },
      { icon: Package, label: 'Transactions', view: 'transactions' },
      { icon: Plus, label: 'Direct Request', view: 'direct-request' },
      { icon: FileText, label: 'Reports', view: 'reports' },
      { icon: Key, label: 'Change Password', view: 'change-password' }
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
      { icon: Plus, label: 'Create Inventory', view: 'create-inventory' },
      { icon: Key, label: 'Manage Passwords', view: 'manage-passwords' }
    ],
    superAdmin: [
      { icon: BarChart3, label: 'Dashboard', view: 'dashboard' },
      // { icon: Globe, label: 'All Locations', view: 'locations' },
      { icon: Users, label: 'All Users', view: 'users' },
      { icon: FileText, label: 'All Requests', view: 'requests' },
      { icon: FileText, label: 'Reports', view: 'reports' },
      // { icon: Package, label: 'Transactions', view: 'transactions' },
      // { icon: Plus, label: 'Direct Request', view: 'direct-request' },
      // { icon: Settings, label: 'Inventory', view: 'inventory' },
      // { icon: Plus, label: 'Add Asset', view: 'add-asset' },
      // { icon: FileText, label: 'Reports', view: 'reports' },
      // { icon: Plus, label: 'Create Inventory', view: 'create-inventory' },
      { icon: Key, label: 'Manage Passwords', view: 'manage-admin-passwords' },
      { icon: Building, label: 'Location Management', view: 'location-management' }
    ]
  };
  
  return menuItems[role] || [];
};