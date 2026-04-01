import React, { useState, useEffect } from 'react';
import { verifierAPI } from '../../services/api';

const SharedProofs = ({ user }) => {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProof, setSelectedProof] = useState(null);

  useEffect(() => {
    fetchSharedProofs();
  }, []);

  const fetchSharedProofs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await verifierAPI.getSharedProofs();
      setProofs(response.data.data);
    } catch (err) {
      setError('Failed to load shared proofs. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadProof = (proof) => {
    const proofData = {
      credentialId: proof.credentialId,
      credentialType: proof.credentialType,
      holderDID: proof.holderDID,
      issuerDID: proof.issuerDID,
      verifierDID: proof.verifierDID,
      proof: proof.proof,
      revealedAttributes: proof.revealedAttributes,
      hiddenAttributesCount: proof.hiddenAttributesCount,
      sharedAt: proof.createdAt
    };
    const blob = new Blob([JSON.stringify(proofData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zkp-proof-${proof.credentialId?.substring(0, 12)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user.did) {
    return (
      <div className="alert alert-warning">
        <h3>⚠️ DID Required</h3>
        <p>Please create a DID before viewing shared proofs.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ border: '4px solid #e5e7eb', borderTop: '4px solid #10b981', borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#6b7280' }}>Loading shared proofs...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', color: '#111827', marginBottom: '6px' }}>
          📨 Shared Proofs
        </h1>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>
          Credentials shared with you by holders using Zero-Knowledge Proofs
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', marginBottom: '20px', color: '#991b1b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={fetchSharedProofs} style={{ padding: '6px 14px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>Retry</button>
        </div>
      )}

      {proofs.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ fontSize: '20px', color: '#111827', marginBottom: '8px' }}>No proofs received yet</h3>
          <p style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto' }}>
            When a holder shares a credential with your DID, the proof will appear here. Share your DID with holders so they can send you credentials.
          </p>
          <div style={{ marginTop: '24px', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '14px 20px', display: 'inline-block' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Your DID</p>
            <code style={{ fontSize: '13px', color: '#1f2937', fontFamily: 'monospace' }}>{user.did}</code>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {proofs.map((proof, index) => (
            <div key={proof._id || index} style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>

              {/* Card Header */}
              <div style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>
                    🔐 {proof.credentialType || 'Credential Proof'}
                  </span>
                </div>
                <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                  ZKP Proof
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '16px' }}>

                  {/* Credential ID */}
                  <div style={{ backgroundColor: '#f9fafb', borderRadius: '6px', padding: '12px' }}>
                    <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Credential ID</p>
                    <code style={{ fontSize: '12px', color: '#1f2937', fontFamily: 'monospace', wordBreak: 'break-all' }}>{proof.credentialId}</code>
                  </div>

                  {/* Holder DID */}
                  <div style={{ backgroundColor: '#f9fafb', borderRadius: '6px', padding: '12px' }}>
                    <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Holder DID</p>
                    <code style={{ fontSize: '12px', color: '#1f2937', fontFamily: 'monospace', wordBreak: 'break-all' }}>{proof.holderDID}</code>
                  </div>

                  {/* Issuer DID */}
                  <div style={{ backgroundColor: '#f9fafb', borderRadius: '6px', padding: '12px' }}>
                    <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Issuer DID</p>
                    <code style={{ fontSize: '12px', color: '#1f2937', fontFamily: 'monospace', wordBreak: 'break-all' }}>{proof.issuerDID}</code>
                  </div>

                  {/* Shared At */}
                  <div style={{ backgroundColor: '#f0fdf4', borderRadius: '6px', padding: '12px' }}>
                    <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Shared At</p>
                    <p style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                      {new Date(proof.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Revealed Attributes Preview */}
                {proof.revealedAttributes && (
                  <div style={{ backgroundColor: '#eef2ff', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#4f46e5', fontWeight: '600', textTransform: 'uppercase', marginBottom: '10px' }}>
                      🔓 Revealed Attributes ({Object.keys(proof.revealedAttributes).length})
                      {proof.hiddenAttributesCount > 0 && (
                        <span style={{ marginLeft: '8px', color: '#6b7280', fontWeight: '400', textTransform: 'none' }}>
                          · {proof.hiddenAttributesCount} attribute{proof.hiddenAttributesCount !== 1 ? 's' : ''} hidden
                        </span>
                      )}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {Object.entries(proof.revealedAttributes).map(([key, value]) => (
                        <div key={key} style={{ backgroundColor: 'white', borderRadius: '6px', padding: '6px 12px', border: '1px solid #c7d2fe', fontSize: '13px' }}>
                          <span style={{ color: '#6b7280', fontWeight: '600' }}>{key}: </span>
                          <span style={{ color: '#1f2937' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proof Hash */}
                {proof.proof?.proofHash && (
                  <div style={{ backgroundColor: '#1f2937', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Proof Hash</p>
                    <code style={{ fontSize: '11px', color: '#10b981', fontFamily: 'monospace', wordBreak: 'break-all' }}>{proof.proof.proofHash}</code>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => downloadProof(proof)}
                    style={{ padding: '9px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    ⬇️ Download Proof JSON
                  </button>
                  <button
                    onClick={() => setSelectedProof(selectedProof?._id === proof._id ? null : proof)}
                    style={{ padding: '9px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontFamily: 'inherit' }}
                  >
                    {selectedProof?._id === proof._id ? '▲ Hide Raw Proof' : '👁️ View Raw Proof'}
                  </button>
                </div>

                {/* Raw Proof Viewer */}
                {selectedProof?._id === proof._id && (
                  <div style={{ marginTop: '16px', backgroundColor: '#111827', borderRadius: '8px', padding: '16px', overflow: 'auto', maxHeight: '300px' }}>
                    <pre style={{ fontSize: '11px', color: '#d1d5db', fontFamily: 'monospace', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {JSON.stringify(proof, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedProofs;