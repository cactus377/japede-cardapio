
import React, { useState, useEffect } from 'react';
import Header from '@components/Header';
import Sidebar from '@components/Sidebar';
import MenuManagementPage from '@pages/MenuManagementPage';
import OrderDashboardPage from '@pages/OrderDashboardPage';
import DashboardPage from '@pages/DashboardPage';
import KitchenDisplayPage from '@pages/KitchenDisplayPage';
import TableManagementPage from '@pages/TableManagementPage';
import CustomerManagementPage from '@pages/CustomerManagementPage'; 
import FinancialsPage from '@pages/FinancialsPage';
import SettingsPage from '@pages/SettingsPage';
import CustomerAppLayout from '@pages/customer/CustomerAppLayout';
import { useAppContext } from '@contexts/AppContext';
import Alert from '@components/shared/Alert';
import LoadingSpinner from '@components/shared/LoadingSpinner';
import PrintPage from '@pages/PrintPage'; 
import LoginPage from '@pages/LoginPage'; 
import ResetPasswordPage from '@pages/ResetPasswordPage';


export type View = 
  | 'dashboard' 
  | 'menu' 
  | 'orders' 
  | 'kitchen' 
  | 'tables' 
  | 'customers' 
  | 'financials' 
  | 'settings';

const App: React.FC = () => {
  const [currentAdminView, setCurrentAdminView] = useState<View>('dashboard');
  const [isCustomerView, setIsCustomerView] = useState<boolean>(false);
  const [isPrintView, setIsPrintView] = useState<boolean>(false);
  const [isResetPasswordView, setIsResetPasswordView] = useState<boolean>(false);
  const [printViewProps, setPrintViewProps] = useState<{orderId: string; printType: 'kitchen' | 'order'} | null>(null);

  const { 
    alert, 
    setAlert: dismissAlert, 
    isLoading: isAppContextLoading, // General data loading
    isLoadingSettings, 
    settings,
    shouldOpenManualOrderModal,
    currentUser, 
    authLoading, // Auth specific loading
  } = useAppContext();

  useEffect(() => {
    const checkView = () => {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname; 

      const customerViewFromUrl = params.get('view') === 'customer';
      const printViewFromUrl = params.get('view') === 'print';
      const resetPasswordViewFromUrl = path === '/reset-password' || params.get('view') === 'reset-password'; // Allow both path and query param
      const resetToken = params.get('token');
      
      const orderIdFromUrl = params.get('orderId');
      const printTypeFromUrl = params.get('printType') as 'kitchen' | 'order' | null;
      
      setIsCustomerView(customerViewFromUrl && !printViewFromUrl && !resetPasswordViewFromUrl);
      setIsPrintView(printViewFromUrl && !!orderIdFromUrl && !!printTypeFromUrl);
      setIsResetPasswordView(resetPasswordViewFromUrl && !!resetToken);


      if (printViewFromUrl && orderIdFromUrl && printTypeFromUrl) {
        setPrintViewProps({ orderId: orderIdFromUrl, printType: printTypeFromUrl });
        document.title = `Imprimir Pedido - ${orderIdFromUrl}`;
      } else if (customerViewFromUrl) {
        document.title = settings?.store?.store_name ? `${settings.store.store_name} - Cardápio` : 'Cardápio Online';
      } else if (resetPasswordViewFromUrl && resetToken) {
        document.title = 'Redefinir Senha - JáPede';
      }
       else if (!currentUser && !authLoading) { // If not logged in and not loading auth
        document.title = 'Login - JáPede Admin';
      }
       else { 
        document.title = settings?.store?.store_name ? `${settings.store.store_name} - Admin` : 'JáPede - Painel de Controle';
      }
      console.log(`[App.tsx] useEffect (popstate/init) - CustomerView: ${isCustomerView}, PrintView: ${isPrintView}, ResetPasswordView: ${isResetPasswordView}`);
    };

    checkView(); 
    window.addEventListener('popstate', checkView); 
    return () => {
      window.removeEventListener('popstate', checkView);
    };
  }, [currentUser, authLoading, settings]); // Add currentUser, authLoading, settings as dependencies for title updates


  useEffect(() => {
    if (currentUser && shouldOpenManualOrderModal && !isCustomerView && !isPrintView && !isResetPasswordView) {
      setCurrentAdminView('orders');
    }
  }, [currentUser, shouldOpenManualOrderModal, isCustomerView, isPrintView, isResetPasswordView]);


  const renderAdminView = () => {
    switch (currentAdminView) {
      case 'dashboard': return <DashboardPage />;
      case 'menu': return <MenuManagementPage />;
      case 'orders': return <OrderDashboardPage />;
      case 'kitchen': return <KitchenDisplayPage />;
      case 'tables': return <TableManagementPage />;
      case 'customers': return <CustomerManagementPage />;
      case 'financials': return <FinancialsPage />;
      case 'settings': return <SettingsPage />; 
      default: return <DashboardPage />;
    }
  };

  console.log(`[App.tsx] Rendering: isCustomerView=${isCustomerView}, isPrintView=${isPrintView}, isResetPasswordView=${isResetPasswordView}, authLoading=${authLoading}, currentUser=${!!currentUser}, isLoadingSettings=${isLoadingSettings}, isAppContextLoading=${isAppContextLoading}`);
  
  // Global loading for auth check, if not in specific views that bypass auth
  if (authLoading && !isCustomerView && !isPrintView && !isResetPasswordView) {
    console.log('[App.tsx] Showing global loading spinner for auth.');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <LoadingSpinner size="w-16 h-16" color="text-primary" />
        <p className="mt-4 text-lg text-gray-600">Verificando autenticação...</p>
      </div>
    );
  }
  
  if (isPrintView && printViewProps) {
    console.log('[App.tsx] Rendering PrintPage.');
    return <PrintPage orderId={printViewProps.orderId} printType={printViewProps.printType} />;
  }
  
  if (isResetPasswordView) {
    console.log('[App.tsx] Rendering ResetPasswordPage.');
    return <ResetPasswordPage />;
  }
  
  if (isCustomerView) {
    console.log('[App.tsx] Rendering CustomerAppLayout.');
     if (isAppContextLoading || (isLoadingSettings && !settings)) { 
        console.log('[App.tsx] Showing loading spinner for customer view settings/app context.');
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <LoadingSpinner size="w-16 h-16" color="text-primary" />
            <p className="mt-4 text-lg text-gray-600">Carregando informações da loja...</p>
          </div>
        );
    }
    return (
      <>
        {alert && <Alert message={alert.message} type={alert.type} onClose={() => dismissAlert(null)} duration={5000} />}
        <CustomerAppLayout />
      </>
    );
  }

  // If not authenticated, and not any of the public views, show LoginPage
  if (!currentUser && !authLoading) {
    console.log('[App.tsx] Rendering LoginPage.');
    return (
        <>
         {alert && <Alert message={alert.message} type={alert.type} onClose={() => dismissAlert(null)} duration={5000} />}
         <LoginPage />
        </>
    );
  }

  // Admin View - currentUser exists
  console.log('[App.tsx] Rendering Admin Panel for authenticated user.');
  if (isAppContextLoading || (isLoadingSettings && !settings)) { // Still need to load app data
    console.log('[App.tsx] Showing global loading spinner for admin app/settings.');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <LoadingSpinner size="w-16 h-16" color="text-primary" />
        <p className="mt-4 text-lg text-gray-600">Carregando painel de controle...</p>
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be caught by the LoginPage render, but as a fallback:
    console.log('[App.tsx] Fallback: No currentUser, but authLoading is false. Rendering loading or error.');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <LoadingSpinner size="w-16 h-16" color="text-primary" />
        <p className="mt-4 text-lg text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header setCurrentView={setCurrentAdminView} />
      <div className="flex flex-1">
        <Sidebar currentView={currentAdminView} setCurrentView={setCurrentAdminView} />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {alert && <Alert message={alert.message} type={alert.type} onClose={() => dismissAlert(null)} />}
          {renderAdminView()}
        </main>
      </div>
    </div>
  );
};

export default App;