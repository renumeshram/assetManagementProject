import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../hooks/useNavigation';
import Sidebar from '../common/Sidebar';
import Header from '../common/Header';
import Dashboard from '../dashboard/Dashboard';
import RequestForm from '../requests/RequestForm';
import RequestsList from '../requests/RequestsList';
import TransactionsList from '../transactions/TransactionsList';
import InventoryList from '../inventory/InventoryList';
import UsersList from '../users/UsersList';
import Reports from '../reports/Reports';

const AppLayout = () => {
  const { user } = useAuth();
  const { currentView, navigate } = useNavigation();

  const getPageTitle = () => {
    const titles = {
      'dashboard': 'Dashboard',
      'request': 'New Request',
      'my-requests': 'My Requests',
      'requests': 'All Requests',
      'transactions': 'Transactions',
      'direct-request': 'Direct Request',
      'reports': 'Reports',
      'users': 'Users Management',
      'inventory': 'Inventory Management'
    };
    return titles[currentView] || 'Dashboard';
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'request':
        return <RequestForm />;
      case 'my-requests':
        return <RequestsList />;
      case 'requests':
        return <RequestsList />;
      case 'transactions':
        return <TransactionsList />;
      case 'direct-request':
        return <RequestForm isDirect={true} />;
      case 'reports':
        return <Reports />;
      case 'users':
        return <UsersList />;
      case 'inventory':
        return <InventoryList />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        role={user.role} 
        onNavigate={navigate} 
        currentView={currentView}
      />
      
      <div className="flex-1">
        <Header title={getPageTitle()} user={user} />
        
        <main className="flex-1">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;