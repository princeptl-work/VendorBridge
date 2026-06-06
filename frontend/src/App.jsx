import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Loader from './components/common/Loader';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import VendorList from './pages/Vendors/VendorList';
import VendorForm from './pages/Vendors/VendorForm';
import RFQList from './pages/RFQ/RFQList';
import RFQForm from './pages/RFQ/RFQForm';
import RFQDetail from './pages/RFQ/RFQDetail';
import QuotationForm from './pages/Quotations/QuotationForm';
import QuotationList from './pages/Quotations/QuotationList';
import QuotationComparison from './pages/Quotations/QuotationComparison';
import Approvals from './pages/Approvals/Approvals';
import POList from './pages/PurchaseOrders/POList';
import PODetail from './pages/PurchaseOrders/PODetail';
import InvoiceList from './pages/Invoices/InvoiceList';
import InvoiceDetail from './pages/Invoices/InvoiceDetail';
import ActivityLogs from './pages/ActivityLogs/ActivityLogs';
import Reports from './pages/Reports/Reports';
import UserManagement from './pages/Users/UserManagement';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/vendors" element={<ProtectedRoute roles={['admin','procurement_officer','manager']}><VendorList /></ProtectedRoute>} />
      <Route path="/vendors/new" element={<ProtectedRoute roles={['admin','procurement_officer']}><VendorForm /></ProtectedRoute>} />
      <Route path="/vendors/:id/edit" element={<ProtectedRoute roles={['admin','procurement_officer']}><VendorForm /></ProtectedRoute>} />
      <Route path="/rfqs" element={<ProtectedRoute><RFQList /></ProtectedRoute>} />
      <Route path="/rfqs/new" element={<ProtectedRoute roles={['admin','procurement_officer']}><RFQForm /></ProtectedRoute>} />
      <Route path="/rfqs/:id" element={<ProtectedRoute><RFQDetail /></ProtectedRoute>} />
      <Route path="/rfqs/:id/edit" element={<ProtectedRoute roles={['admin','procurement_officer']}><RFQForm /></ProtectedRoute>} />
      <Route path="/rfqs/:id/compare" element={<ProtectedRoute roles={['admin','procurement_officer','manager']}><QuotationComparison /></ProtectedRoute>} />
      <Route path="/quotations" element={<ProtectedRoute><QuotationList /></ProtectedRoute>} />
      <Route path="/quotations/submit/:rfqId" element={<ProtectedRoute roles={['vendor','admin']}><QuotationForm /></ProtectedRoute>} />
      <Route path="/quotations/:id/edit" element={<ProtectedRoute roles={['vendor','admin']}><QuotationForm /></ProtectedRoute>} />
      <Route path="/approvals" element={<ProtectedRoute roles={['admin','manager','procurement_officer']}><Approvals /></ProtectedRoute>} />
      <Route path="/purchase-orders" element={<ProtectedRoute><POList /></ProtectedRoute>} />
      <Route path="/purchase-orders/:id" element={<ProtectedRoute><PODetail /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
      <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
      <Route path="/activity-logs" element={<ProtectedRoute roles={['admin','manager']}><ActivityLogs /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={['admin','manager']}><Reports /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
