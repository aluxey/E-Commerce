// App.jsx — corrigé
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProductAdmin from './components/ProductAdmin';
import PrivateRoute from './components/PrivateRoute';
import AuthForm from './pages/AuthForm';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin" element={<PrivateRoute role="admin"><ProductAdmin /></PrivateRoute>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
