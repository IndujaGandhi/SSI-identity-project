import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from '../Common/Navbar';
import Footer from '../Common/Footer';
import CreateDID from '../DID/CreateDID';
import CredentialRequests from './CredentialRequests';
import IssueCredential from './IssueCredential';
import { issuerAPI, authAPI } from '../../services/api';
import '../../styles/Dashboard.css';
import DIDDisplay from '../Common/DIDDisplay';



const IssuerDashboard = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState(initialUser);
  const [stats, setStats] = useState({
    pending: 0,
    issued: 0,
    revoked: 0
  });
 const [, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [pendingRes, issuedRes] = await Promise.all([
        issuerAPI.getRequests(),
        issuerAPI.getIssued()
      ]);

      setStats({
        pending: pendingRes.data.count,
        issued: issuedRes.data.count,
        revoked: issuedRes.data.data.filter(c => c.status === 'revoked').length
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDIDCreated = async (didData) => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data.data.user);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const refreshStats = () => {
    fetchStats();
  };

  return (
    <div className="dashboard-container">
      <Navbar user={user} onLogout={onLogout} />

      <div className="dashboard-content">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h3>📋 Issuer Menu</h3>
          </div>
          <nav className="sidebar-nav">
            <Link
              to="/issuer"
              className={location.pathname === '/issuer' ? 'active' : ''}
            >
              📊 Dashboard
            </Link>
            <Link
              to="/issuer/requests"
              className={location.pathname === '/issuer/requests' ? 'active' : ''}
            >
              📥 Credential Requests ({stats.pending})
            </Link>
            <Link
              to="/issuer/issued"
              className={location.pathname === '/issuer/issued' ? 'active' : ''}
            >
              ✅ Issued Credentials ({stats.issued})
            </Link>
          </nav>
        </aside>

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <div className="page-header">
                    <h1>Issuer Dashboard</h1>
                    <p>Issue and manage verifiable credentials</p>
                  </div>
                  {user && (
  <DIDDisplay 
    did={user.did}
    userName={user.name}
    role={user.role}
  />
)}

                  {!user.did ? (
                    <CreateDID user={user} onDIDCreated={handleDIDCreated} />
                  ) : (
                    <>
                      <div className="stats-grid">
                        <div className="stat-card">
                          <div className="stat-icon">📥</div>
                          <div className="stat-info">
                            <h3>{stats.pending}</h3>
                            <p>Pending Requests</p>
                          </div>
                        </div>

                        <div className="stat-card">
                          <div className="stat-icon">✅</div>
                          <div className="stat-info">
                            <h3>{stats.issued}</h3>
                            <p>Issued Credentials</p>
                          </div>
                        </div>

                        <div className="stat-card">
                          <div className="stat-icon">🚫</div>
                          <div className="stat-info">
                            <h3>{stats.revoked}</h3>
                            <p>Revoked Credentials</p>
                          </div>
                        </div>
                      </div>

                      <div className="info-section">
                        <h2>Welcome, {user.username}!</h2>
                        <p>
                          As an issuer, you can review credential requests from holders
                          and issue verifiable credentials that are stored on IPFS and
                          anchored to the blockchain.
                        </p>

                        <div className="quick-actions">
                          <h3>Quick Actions</h3>
                          <Link to="/issuer/requests" className="btn-action">
                            View Pending Requests
                          </Link>
                          <Link to="/issuer/issued" className="btn-action">
                            View Issued Credentials
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </>
              }
            />
            <Route
              path="/requests"
              element={
                <CredentialRequests user={user} onStatsUpdate={refreshStats} />
              }
            />
            <Route
              path="/issued"
              element={<IssueCredential user={user} onStatsUpdate={refreshStats} />}
            />
          </Routes>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default IssuerDashboard;