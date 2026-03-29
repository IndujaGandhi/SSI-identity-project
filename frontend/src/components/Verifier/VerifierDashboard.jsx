import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from '../Common/Navbar';
import Footer from '../Common/Footer';
import CreateDID from '../DID/CreateDID';
import VerifyCredential from './VerifyCredential';
import VerificationHistory from './VerificationHistory';
import { verifierAPI, authAPI } from '../../services/api';
import '../../styles/Dashboard.css';
import DIDDisplay from '../Common/DIDDisplay';


const VerifierDashboard = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState(initialUser);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    failed: 0
  });
  const [, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await verifierAPI.getHistory();
      const history = response.data.data;
      
      setStats({
        total: history.length,
        verified: history.filter(h => h.status === 'success').length,
        failed: history.filter(h => h.status === 'failed').length
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
            <h3>✓ Verifier Menu</h3>
          </div>
          <nav className="sidebar-nav">
            <Link
              to="/verifier"
              className={location.pathname === '/verifier' ? 'active' : ''}
            >
              📊 Dashboard
            </Link>
            <Link
              to="/verifier/verify"
              className={location.pathname === '/verifier/verify' ? 'active' : ''}
            >
              🔍 Verify Credential
            </Link>
            <Link
              to="/verifier/history"
              className={location.pathname === '/verifier/history' ? 'active' : ''}
            >
              📜 Verification History
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
                    <h1>Verifier Dashboard</h1>
                    <p>Verify credentials and check authenticity</p>
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
                          <div className="stat-icon">📊</div>
                          <div className="stat-info">
                            <h3>{stats.total}</h3>
                            <p>Total Verifications</p>
                          </div>
                        </div>

                        <div className="stat-card">
                          <div className="stat-icon">✅</div>
                          <div className="stat-info">
                            <h3>{stats.verified}</h3>
                            <p>Successfully Verified</p>
                          </div>
                        </div>

                        <div className="stat-card">
                          <div className="stat-icon">❌</div>
                          <div className="stat-info">
                            <h3>{stats.failed}</h3>
                            <p>Failed Verifications</p>
                          </div>
                        </div>
                      </div>

                      <div className="info-section">
                        <h2>Welcome, {user.username}!</h2>
                        <p>
                          As a verifier, you can verify credentials presented by holders,
                          check their authenticity on the blockchain, and ensure they haven't
                          been revoked. You can also verify Zero-Knowledge Proofs for
                          selective disclosure.
                        </p>

                        <div className="quick-actions">
                          <h3>Quick Actions</h3>
                          <Link to="/verifier/verify" className="btn-action">
                            Verify a Credential
                          </Link>
                          <Link to="/verifier/history" className="btn-action">
                            View History
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </>
              }
            />
            <Route
              path="/verify"
              element={<VerifyCredential user={user} onVerified={refreshStats} />}
            />
            <Route
              path="/history"
              element={<VerificationHistory user={user} />}
            />
          </Routes>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default VerifierDashboard;