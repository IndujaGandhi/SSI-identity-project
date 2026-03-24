import React, { useState, useEffect } from 'react';
import { issuerAPI } from '../../services/api';

const CredentialRequests = ({ user, onStatsUpdate }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // For each request, store its editable attribute list
  const [editableAttrs, setEditableAttrs] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await issuerAPI.getRequests();
      const data = response.data.data;
      setRequests(data);

      // Initialize editable attributes for each request
      const initial = {};
      data.forEach((req) => {
        const attrs = Object.entries(req.attributes).map(([key, value]) => ({
          id: Math.random().toString(36).substr(2, 9),
          key,
          value,
          source: 'holder' // holder-submitted
        }));
        initial[req.credentialId] = attrs;
      });
      setEditableAttrs(initial);
    } catch (error) {
      setError('Failed to fetch credential requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new empty attribute row (issuer-added)
  const handleAddAttribute = (credentialId, insertIndex) => {
    const attrs = [...(editableAttrs[credentialId] || [])];
    const newAttr = {
      id: Math.random().toString(36).substr(2, 9),
      key: '',
      value: '',
      source: 'issuer'
    };
    attrs.splice(insertIndex + 1, 0, newAttr);
    setEditableAttrs({ ...editableAttrs, [credentialId]: attrs });
  };

  // Remove an issuer-added attribute (cannot remove holder's)
  const handleRemoveAttribute = (credentialId, id) => {
    const attrs = editableAttrs[credentialId].filter(
      (a) => !(a.id === id && a.source === 'issuer')
    );
    setEditableAttrs({ ...editableAttrs, [credentialId]: attrs });
  };

  // Edit attribute key or value
  const handleAttrChange = (credentialId, id, field, value) => {
    const attrs = editableAttrs[credentialId].map((a) =>
      a.id === id ? { ...a, [field]: value } : a
    );
    setEditableAttrs({ ...editableAttrs, [credentialId]: attrs });
  };

  // Move attribute up
  const handleMoveUp = (credentialId, index) => {
    if (index === 0) return;
    const attrs = [...editableAttrs[credentialId]];
    [attrs[index - 1], attrs[index]] = [attrs[index], attrs[index - 1]];
    setEditableAttrs({ ...editableAttrs, [credentialId]: attrs });
  };

  // Move attribute down
  const handleMoveDown = (credentialId, index) => {
    const attrs = [...editableAttrs[credentialId]];
    if (index === attrs.length - 1) return;
    [attrs[index], attrs[index + 1]] = [attrs[index + 1], attrs[index]];
    setEditableAttrs({ ...editableAttrs, [credentialId]: attrs });
  };

  // Issue credential with merged attributes
  const handleIssue = async (credentialId) => {
    const attrs = editableAttrs[credentialId] || [];

    // Validate all issuer-added attributes have keys
    const invalid = attrs.filter((a) => a.source === 'issuer' && !a.key.trim());
    if (invalid.length > 0) {
      setError('Please fill in all attribute names before issuing.');
      return;
    }

    if (!window.confirm('Are you sure you want to issue this credential with the current attributes?')) {
      return;
    }

    setProcessingId(credentialId);
    setError('');

    try {
      // Build ordered merged attributes object
      const mergedAttributes = {};
      attrs.forEach((a) => {
        if (a.key.trim()) {
          mergedAttributes[a.key.trim()] = a.value.trim();
        }
      });

      await issuerAPI.issueCredential(credentialId, { mergedAttributes });
      alert('Credential issued successfully!');
      fetchRequests();
      onStatsUpdate();
      setExpandedId(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to issue credential');
    } finally {
      setProcessingId(null);
    }
  };

  if (!user.did) {
    return (
      <div className="alert alert-warning">
        <h3>⚠️ DID Required</h3>
        <p>Please create a DID before managing credential requests.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading requests...</div>;
  }

  return (
    <div className="requests-container">
      <div className="page-header">
        <h1>📥 Credential Requests</h1>
        <p>Review, edit attributes, and issue credentials to holders</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {requests.length === 0 ? (
        <div className="empty-state">
          <h3>No pending requests</h3>
          <p>You don't have any credential requests at the moment.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => {
            const attrs = editableAttrs[request.credentialId] || [];
            const isExpanded = expandedId === request.credentialId;
            const isProcessing = processingId === request.credentialId;

            return (
              <div key={request.credentialId} className="request-card">

                {/* Request Header */}
                <div className="request-header">
                  <h3>{request.credentialType}</h3>
                  <span className="badge badge-pending">{request.status}</span>
                </div>

                {/* Request Details */}
                <div className="request-details">
                  <div className="detail-row">
                    <strong>Credential ID:</strong>
                    <code>{request.credentialId}</code>
                  </div>
                  <div className="detail-row">
                    <strong>Holder DID:</strong>
                    <code>{request.holderDID}</code>
                  </div>
                  <div className="detail-row">
                    <strong>Requested At:</strong>
                    <span>{new Date(request.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Attribute Editor Toggle */}
                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : request.credentialId)}
                    style={{
                      backgroundColor: isExpanded ? '#f3f4f6' : '#eef2ff',
                      color: isExpanded ? '#374151' : '#4f46e5',
                      border: `1px solid ${isExpanded ? '#e5e7eb' : '#c7d2fe'}`,
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    {isExpanded ? '▲ Hide Attribute Editor' : '✏️ Review & Edit Attributes'}
                  </button>
                </div>

                {/* Attribute Editor Panel */}
                {isExpanded && (
                  <div style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '16px'
                  }}>

                    {/* Legend */}
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      marginBottom: '16px',
                      fontSize: '13px'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '12px', height: '12px',
                          backgroundColor: '#dbeafe',
                          border: '1px solid #93c5fd',
                          borderRadius: '2px', display: 'inline-block'
                        }} />
                        Holder's attributes
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '12px', height: '12px',
                          backgroundColor: '#d1fae5',
                          border: '1px solid #6ee7b7',
                          borderRadius: '2px', display: 'inline-block'
                        }} />
                        Your added attributes
                      </span>
                    </div>

                    {/* Column Headers */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr 1fr 100px',
                      gap: '8px',
                      marginBottom: '8px',
                      paddingLeft: '4px'
                    }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                        Order
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                        Attribute Name
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                        Value
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                        Actions
                      </span>
                    </div>

                    {/* Attribute Rows */}
                    {attrs.map((attr, index) => (
                      <div key={attr.id} style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 1fr 100px',
                        gap: '8px',
                        marginBottom: '8px',
                        alignItems: 'center',
                        backgroundColor: attr.source === 'holder' ? '#dbeafe' : '#d1fae5',
                        border: `1px solid ${attr.source === 'holder' ? '#93c5fd' : '#6ee7b7'}`,
                        borderRadius: '6px',
                        padding: '8px'
                      }}>

                        {/* Up/Down Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <button
                            onClick={() => handleMoveUp(request.credentialId, index)}
                            disabled={index === 0}
                            title="Move up"
                            style={{
                              padding: '2px 6px',
                              fontSize: '12px',
                              backgroundColor: 'white',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              cursor: index === 0 ? 'not-allowed' : 'pointer',
                              opacity: index === 0 ? 0.4 : 1,
                              lineHeight: 1,
                              fontFamily: 'inherit'
                            }}
                          >▲</button>
                          <button
                            onClick={() => handleMoveDown(request.credentialId, index)}
                            disabled={index === attrs.length - 1}
                            title="Move down"
                            style={{
                              padding: '2px 6px',
                              fontSize: '12px',
                              backgroundColor: 'white',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              cursor: index === attrs.length - 1 ? 'not-allowed' : 'pointer',
                              opacity: index === attrs.length - 1 ? 0.4 : 1,
                              lineHeight: 1,
                              fontFamily: 'inherit'
                            }}
                          >▼</button>
                        </div>

                        {/* Attribute Key */}
                        <input
                          type="text"
                          value={attr.key}
                          onChange={(e) =>
                            handleAttrChange(request.credentialId, attr.id, 'key', e.target.value)
                          }
                          readOnly={attr.source === 'holder'}
                          placeholder="Attribute name"
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '5px',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            backgroundColor: attr.source === 'holder' ? '#eff6ff' : 'white',
                            color: '#111827',
                            cursor: attr.source === 'holder' ? 'not-allowed' : 'text'
                          }}
                        />

                        {/* Attribute Value */}
                        <input
                          type="text"
                          value={attr.value}
                          onChange={(e) =>
                            handleAttrChange(request.credentialId, attr.id, 'value', e.target.value)
                          }
                          placeholder="Value"
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            border: '1px solid #d1d5db',
                            borderRadius: '5px',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            backgroundColor: 'white',
                            color: '#111827'
                          }}
                        />

                        {/* Add / Remove Buttons */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleAddAttribute(request.credentialId, index)}
                            title="Add attribute below"
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#4f46e5',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '16px',
                              lineHeight: 1,
                              fontFamily: 'inherit'
                            }}
                          >+</button>
                          {attr.source === 'issuer' && (
                            <button
                              onClick={() => handleRemoveAttribute(request.credentialId, attr.id)}
                              title="Remove attribute"
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                lineHeight: 1,
                                fontFamily: 'inherit'
                              }}
                            >×</button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add attribute at end */}
                    <button
                      onClick={() => handleAddAttribute(request.credentialId, attrs.length - 1)}
                      style={{
                        marginTop: '8px',
                        padding: '8px 16px',
                        backgroundColor: 'white',
                        border: '1px dashed #4f46e5',
                        borderRadius: '6px',
                        color: '#4f46e5',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: '100%',
                        fontFamily: 'inherit'
                      }}
                    >
                      + Add New Attribute at End
                    </button>

                    {/* Final Attribute Summary */}
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      backgroundColor: '#1f2937',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#9ca3af',
                      fontFamily: 'monospace'
                    }}>
                      <div style={{ color: '#10b981', marginBottom: '6px', fontWeight: '600' }}>
                        Final credential will contain {attrs.length} attribute(s):
                      </div>
                      {attrs.map((a, i) => (
                        <div key={a.id} style={{ marginBottom: '2px' }}>
                          <span style={{ color: '#f3f4f6' }}>{i + 1}. {a.key || '(unnamed)'}</span>
                          <span style={{ color: '#6b7280' }}> → </span>
                          <span style={{ color: '#fbbf24' }}>{a.value || '(empty)'}</span>
                          <span style={{
                            marginLeft: '8px',
                            color: a.source === 'holder' ? '#60a5fa' : '#34d399',
                            fontSize: '10px'
                          }}>
                            [{a.source}]
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Issue Button */}
                <div className="request-actions">
                  <button
                    onClick={() => handleIssue(request.credentialId)}
                    className="btn-primary"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Issuing...' : '✅ Issue Credential'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CredentialRequests;