const crypto = require('crypto');

// Simulated Zero-Knowledge Proof Service
// In production, this would use actual ZKP libraries like snarkjs, circom, or Indy's ZKP

/**
 * Generate a ZKP for selective disclosure
 * @param {Object} credential - The full credential
 * @param {Array} revealedAttributes - Attributes to reveal
 * @returns {Object} - ZKP proof and revealed attributes
 */
const generateSelectiveDisclosureProof = async (credential, revealedAttributes) => {
  try {
    // Extract only the attributes to reveal
    const disclosedAttributes = {};
    const hiddenAttributes = {};

    Object.keys(credential.attributes).forEach(key => {
      if (revealedAttributes.includes(key)) {
        disclosedAttributes[key] = credential.attributes[key];
      } else {
        hiddenAttributes[key] = '[HIDDEN]';
      }
    });

    // Generate a proof hash (in real ZKP, this would be a cryptographic proof)
    const proofData = {
      credentialId: credential.credentialId,
      credDefId: credential.credDefId,
      disclosedAttributes,
      hiddenAttributesCount: Object.keys(hiddenAttributes).length,
      timestamp: new Date().toISOString()
    };

    const proofHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(proofData))
      .digest('hex');

    return {
  proof: {
    proofHash,
    proofType: 'ZKP-Selective-Disclosure',
    credentialId: credential.credentialId,
    credDefId: credential.credDefId,
    hiddenAttributesCount: Object.keys(hiddenAttributes).length, // ✅ store inside proof
    timestamp: proofData.timestamp
  },
  revealedAttributes: disclosedAttributes,
  hiddenAttributesCount: Object.keys(hiddenAttributes).length
};
  } catch (error) {
    console.error('ZKP generation error:', error);
    throw new Error('Failed to generate ZKP');
  }
};

/**
 * Verify a ZKP
 * @param {Object} proof - The ZKP proof to verify
 * @param {Object} revealedAttributes - The revealed attributes
 * @returns {Object} - Verification result
 */
const verifySelectiveDisclosureProof = async (proof, revealedAttributes) => {
  try {
    if (!proof.proofHash || !proof.credentialId || !proof.credDefId) {
      return { verified: false, reason: 'Invalid proof structure' };
    }

    // Rebuild proofData exactly as it was during generation
    const proofData = {
      credentialId: proof.credentialId,
      credDefId: proof.credDefId,
      disclosedAttributes: revealedAttributes,  // ✅ key name matches generation
      hiddenAttributesCount: proof.hiddenAttributesCount || 0, // ✅ now stored in proof
      timestamp: proof.timestamp
    };

    const calculatedHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(proofData))
      .digest('hex');

    const isValid = calculatedHash === proof.proofHash;

    return {
      verified: isValid,
      proofType: proof.proofType,
      credentialId: proof.credentialId,
      revealedAttributes,
      verifiedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('ZKP verification error:', error);
    return { verified: false, reason: error.message };
  }
};
/**
 * Generate proof of credential ownership without revealing attributes
 * @param {Object} credential - The credential
 * @returns {Object} - Ownership proof
 */
const generateOwnershipProof = async (credential) => {
  try {
    const proofData = {
      credentialId: credential.credentialId,
      holderDID: credential.holderDID,
      timestamp: new Date().toISOString()
    };

    const proofHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(proofData))
      .digest('hex');

    return {
      proof: {
        proofHash,
        proofType: 'ZKP-Ownership',
        credentialId: credential.credentialId,
        timestamp: proofData.timestamp
      }
    };
  } catch (error) {
    console.error('Ownership proof generation error:', error);
    throw new Error('Failed to generate ownership proof');
  }
};

/**
 * Generate proof of attribute range (e.g., age > 18) without revealing exact value
 * @param {Object} credential - The credential
 * @param {String} attribute - The attribute name
 * @param {String} operator - Comparison operator (>, <, >=, <=, ==)
 * @param {*} value - The comparison value
 * @returns {Object} - Range proof
 */
const generateRangeProof = async (credential, attribute, operator, value) => {
  try {
    const attributeValue = credential.attributes[attribute];
    
    let predicateResult = false;
    switch (operator) {
      case '>':
        predicateResult = Number(attributeValue) > Number(value);
        break;
      case '<':
        predicateResult = Number(attributeValue) < Number(value);
        break;
      case '>=':
        predicateResult = Number(attributeValue) >= Number(value);
        break;
      case '<=':
        predicateResult = Number(attributeValue) <= Number(value);
        break;
      case '==':
        predicateResult = attributeValue === value;
        break;
      default:
        throw new Error('Invalid operator');
    }

    const proofData = {
      credentialId: credential.credentialId,
      predicate: `${attribute} ${operator} ${value}`,
      result: predicateResult,
      timestamp: new Date().toISOString()
    };

    const proofHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(proofData))
      .digest('hex');

    return {
      proof: {
        proofHash,
        proofType: 'ZKP-Range',
        credentialId: credential.credentialId,
        predicate: proofData.predicate,
        result: predicateResult,
        timestamp: proofData.timestamp
      }
    };
  } catch (error) {
    console.error('Range proof generation error:', error);
    throw new Error('Failed to generate range proof');
  }
};

module.exports = {
  generateSelectiveDisclosureProof,
  verifySelectiveDisclosureProof,
  generateOwnershipProof,
  generateRangeProof
};