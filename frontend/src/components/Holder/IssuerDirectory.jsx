import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const IssuerDirectory = () => {
  const [issuers, setIssuers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copiedDID, setCopiedDID] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIssuers();
  }, [searchTerm, selectedCategory, currentPage]);

  const fetchIssuers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage, limit: 9 };
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;

      const response = await axios.get(`${API_URL}/api/directory/issuers`, { params });

      if (response.data.success) {
        setIssuers(response.data.data);
        setTotalPages(response.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching issuers:', error);
      setError('Failed to load issuers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyDID = async (did) => {
    try {
      await navigator.clipboard.writeText(did);
      setCopiedDID(did);
      setTimeout(() => setCopiedDID(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setCurrentPage(1);
  };

  return (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '30px' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', color: '#111827', marginBottom: '8px' }}>
          🏛️ Issuer Directory
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Browse and find trusted credential issuers on the platform
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="🔍  Search by email or organization..."
          value={searchTerm}
          onChange={handleSearch}
          style={{
            flex: '1',
            minWidth: '220px',
            padding: '10px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'inherit'
          }}
          onFocus={e => e.target.style.borderColor = '#4f46e5'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />

        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          style={{
            padding: '10px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: '#111827'
          }}
        >
          <option value="">All Categories</option>
          <option value="Education">Education</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Government">Government</option>
          <option value="Finance">Finance</option>
          <option value="Technology">Technology</option>
          <option value="Other">Other</option>
        </select>

        {(searchTerm || selectedCategory) && (
          <button
            onClick={resetFilters}
            style={{
              padding: '10px 18px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#374151',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            ✕ Clear Filters
          </button>
        )}

        <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: 'auto' }}>
          {issuers.length} issuer{issuers.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #4f46e5',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading issuers...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          color: '#991b1b'
        }}>
          <p style={{ marginBottom: '12px', fontWeight: '500' }}>{error}</p>
          <button
            onClick={fetchIssuers}
            style={{
              padding: '10px 24px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Issuers Grid */}
      {!loading && !error && (
        <>
          {issuers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ fontSize: '20px', color: '#111827', marginBottom: '8px' }}>
                No issuers found
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                Try adjusting your search or clearing the filters
              </p>
              <button
                onClick={resetFilters}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {issuers.map((issuer) => (
                <div
                  key={issuer._id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Card Top Bar */}
                  <div style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    padding: '14px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '16px'
                    }}>
                      🏢 {issuer.organization || 'Unknown Organization'}
                    </span>
                    <span style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {issuer.category || 'Other'}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '20px' }}>

                    {/* Email */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                      padding: '10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px'
                    }}>
                      <span>📧</span>
                      <span style={{ fontSize: '14px', color: '#374151' }}>
                        {issuer.email}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '16px',
                      lineHeight: '1.6',
                      minHeight: '40px'
                    }}>
                      {issuer.description || 'No description provided.'}
                    </p>

                    {/* Stats Row */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        flex: 1,
                        backgroundColor: '#eef2ff',
                        borderRadius: '6px',
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: '700',
                          color: '#4f46e5'
                        }}>
                          {issuer.issuedCredentialsCount || 0}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                          Credentials Issued
                        </div>
                      </div>
                      <div style={{
                        flex: 1,
                        backgroundColor: '#f0fdf4',
                        borderRadius: '6px',
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#10b981'
                        }}>
                          {new Date(issuer.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                          Member Since
                        </div>
                      </div>
                    </div>

                    {/* DID Section */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        marginBottom: '6px'
                      }}>
                        Issuer DID
                      </label>
                      {issuer.did ? (
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'center',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '6px',
                          padding: '8px 10px'
                        }}>
                          <code style={{
                            flex: 1,
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: '#1f2937',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            backgroundColor: 'transparent',
                            padding: 0
                          }}>
                            {issuer.did}
                          </code>
                          <button
                            onClick={() => copyDID(issuer.did)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              backgroundColor: copiedDID === issuer.did ? '#10b981' : '#4f46e5',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              fontFamily: 'inherit',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            {copiedDID === issuer.did ? '✓ Copied' : '📋 Copy'}
                          </button>
                        </div>
                      ) : (
                        <span style={{
                          fontSize: '13px',
                          color: '#9ca3af',
                          fontStyle: 'italic'
                        }}>
                          DID not assigned yet
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginTop: '24px'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 18px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.4 : 1,
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              >
                ← Previous
              </button>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 18px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.4 : 1,
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Copy Toast Notification */}
      {copiedDID && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          ✓ DID copied to clipboard!
        </div>
      )}

    </div>
  );
};

export default IssuerDirectory;