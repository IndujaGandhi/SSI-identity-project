import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from '../Common/Navbar';
import Footer from '../Common/Footer';
import CreateDID from '../DID/CreateDID';
import RequestCredential from './RequestCredential';
import MyCredentials from './MyCredentials';
import ShareCredential from './ShareCredential';
import { holderAPI, authAPI } from '../../services/api';
import '../../styles/Dashboard.css';
import DIDDisplay from '../Common/DIDDisplay';
import IssuerDirectory from './IssuerDirectory';


const HolderDashboard = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState(initialUser);
  const [stats, setStats] = useState({
    total: 0,
    issued: 0,
    pending: 0,
    revoked: 0
  });
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await holderAPI.getDashboard();
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
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
    fetchDashboard();
  };

  

  return (
    <div className="dashboard-container">
      <Navbar user={user} onLogout={onLogout} />

      <div className="dashboard-content">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h3>👤 Holder Menu</h3>
          </div>
          <nav className="sidebar-nav">
            <Link
              to="/holder"
              className={location.pathname === '/holder' ? 'active' : ''}
            >
              📊 Dashboard
            </Link>

             <Link
               to="/holder/issuers"
               className={location.pathname === '/holder/issuers' ? 'active' : ''}
               >
               🔍 Find Issuers
            </Link>
            <Link
              to="/holder/request"
              className={location.pathname === '/holder/request' ? 'active' : ''}
            >
              📝 Request Credential
            </Link>
            <Link
              to="/holder/credentials"
              className={location.pathname === '/holder/credentials' ? 'active' : ''}
            >
              🎫 My Credentials ({stats.total})
            </Link>
            <Link
              to="/holder/share"
              className={location.pathname === '/holder/share' ? 'active' : ''}
            >
              🔗 Share Credential
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
                    <h1>Holder Dashboard</h1>
                    <p>Manage your verifiable credentials</p>
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
                          <div className="stat-icon">🎫</div>
                          <div className="stat-info">
                            <h3>{stats.total}</h3>
                            <p>Total Credentials</p>
                          </div>
                        </div>

                        <div className="stat-card">
                          <div className="stat-icon">✅</div>
                          <div className="stat-info">
                            <h3>{stats.issued}</h3>
                            <p>Issued</p>
                          </div>
                        </div>

                        <div className="stat-card">
                          <div className="stat-icon">⏳</div>
                          <div className="stat-info">
                            <h3>{stats.pending}</h3>
                            <p>Pending</p>
                          </div>
                        </div>

                        <div className="stat-card">
                          <div className="stat-icon">🚫</div>
                          <div className="stat-info">
                            <h3>{stats.revoked}</h3>
                            <p>Revoked</p>
                          </div>
                        </div>
                      </div>

                      <div className="info-section">
                        <h2>Welcome, {user.username}!</h2>
                        <p>
                          As a holder, you can request credentials from issuers, store them
                          securely, and share them with verifiers using zero-knowledge proofs
                          for selective disclosure.
                        </p>

                        <div className="quick-actions">
                          <h3>Quick Actions</h3>
                          <Link to="/holder/request" className="btn-action">
                            Request New Credential
                          </Link>
                          <Link to="/holder/credentials" className="btn-action">
                            View My Credentials
                          </Link>
                          <Link to="/holder/share" className="btn-action">
                            Share Credential
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </>
              }
            />
            <Route
              path="/request"
              element={<RequestCredential user={user} onStatsUpdate={refreshStats} />}
            />
            <Route
              path="/credentials"
              element={<MyCredentials user={user} />}
            />
            <Route
              path="/share"
              element={<ShareCredential user={user} />}
            />
            <Route
              path="/issuers"
              element={<IssuerDirectory />}
           />
          </Routes>
          
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default HolderDashboard;