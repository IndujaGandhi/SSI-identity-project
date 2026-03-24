import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import IssuerDashboard from './components/Issuer/IssuerDashboard';
import HolderDashboard from './components/Holder/HolderDashboard';
import VerifierDashboard from './components/Verifier/VerifierDashboard';
import ProtectedRoute from './components/Common/ProtectedRoute';
import { authAPI } from './services/api';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/issuer/*"
            element={
              <ProtectedRoute user={user} requiredRole="issuer">
                <IssuerDashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/holder/*"
            element={
              <ProtectedRoute user={user} requiredRole="holder">
                <HolderDashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/verifier/*"
            element={
              <ProtectedRoute user={user} requiredRole="verifier">
                <VerifierDashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/"
            element={
              user ? (
                <Navigate to={`/${user.role}`} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

</Routes>
         
  </div>
    </Router>
  );
}

export default App;