const { v4: uuidv4 } = require('uuid');
const Credential = require('../models/Credential');
const User = require('../models/User');
const { uploadToIPFS } = require('../services/ipfsService');
const { createSchema, createCredentialDefinition, issueCredential, anchorCredentialHash } = require('../services/blockchainService');
const { hashData } = require('../utils/encryption');
const { logActivity } = require('../utils/logger');

// @desc    Get all pending credential requests
// @route   GET /api/issuer/requests
// @access  Private (Issuer only)
const getPendingRequests = async (req, res) => {
  try {
    const issuerDID = req.user.did;

    const requests = await Credential.find({
      issuerDID,
      status: 'pending'
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credential requests',
      error: error.message
    });
  }
};

// @desc    Issue credential to holder
// @route   POST /api/issuer/issue/:credentialId
// @access  Private (Issuer only)
const issueCredentialToHolder = async (req, res) => {
  try {
    const { credentialId } = req.params;
    const issuerDID = req.user.did;

    // ✅ Accept mergedAttributes from issuer (contains both holder + issuer attributes in order)
    const { mergedAttributes } = req.body;

    // Find credential request
    const credential = await Credential.findOne({ credentialId, issuerDID });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential request not found'
      });
    }

    if (credential.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Credential already ${credential.status}`
      });
    }

    // ✅ Use mergedAttributes if provided, else fall back to holder's original attributes
const finalAttributes = mergedAttributes 
  ? mergedAttributes 
  : Object.fromEntries(credential.attributes);

// Convert to Map to preserve insertion order in MongoDB
const finalAttributesMap = new Map(Object.entries(finalAttributes));

    // Create schema (if not exists)
    const schema = await createSchema(
      issuerDID,
      credential.credentialType,
      '1.0',
      Object.keys(finalAttributes)
    );

    // Create credential definition
    const credDef = await createCredentialDefinition(issuerDID, schema);

    // Issue credential on blockchain
    const issuedCred = await issueCredential(credDef.id, finalAttributes);

    // Prepare credential data for IPFS
    const credentialData = {
      credentialId,
      schemaId: schema.id,
      credDefId: credDef.id,
      issuerDID,
      holderDID: credential.holderDID,
      attributes: Object.fromEntries(finalAttributesMap),
      issuedAt: new Date().toISOString(),
      signature: issuedCred.signature || `sig_${uuidv4()}`
    };

    // Upload to IPFS (encrypted)
    const ipfsHash = await uploadToIPFS(credentialData);

    // Create hash for blockchain
    const credentialHash = hashData(credentialData);

    // Anchor hash to blockchain
    const anchorResult = await anchorCredentialHash(credentialHash, issuerDID);

    // ✅ Update credential with final merged attributes
    credential.attributes = finalAttributesMap;
    credential.schemaId = schema.id;
    credential.credDefId = credDef.id;
    credential.ipfsHash = ipfsHash;
    credential.blockchainHash = credentialHash;
    credential.status = 'issued';
    credential.issuedAt = new Date();
    await credential.save();

    // Log activity
    await logActivity({
      userId: req.user._id,
      userDID: issuerDID,
      activityType: 'credential_issued',
      credentialId,
      relatedUserDID: credential.holderDID,
      status: 'success',
      metadata: {
        ipfsHash,
        blockchainHash: credentialHash,
        blockchainTxnId: anchorResult.blockchainTxnId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Credential issued successfully',
      data: {
        credential,
        ipfsHash,
        blockchainHash: credentialHash,
        transactionId: anchorResult.blockchainTxnId
      }
    });
  } catch (error) {
    console.error('Issue credential error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to issue credential',
      error: error.message
    });
  }
};

// @desc    Get all issued credentials
// @route   GET /api/issuer/issued
// @access  Private (Issuer only)
const getIssuedCredentials = async (req, res) => {
  try {
    const issuerDID = req.user.did;

    const credentials = await Credential.find({
      issuerDID,
      status: 'issued'
    }).sort({ issuedAt: -1 });

    res.status(200).json({
      success: true,
      count: credentials.length,
      data: credentials
    });
  } catch (error) {
    console.error('Get issued credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get issued credentials',
      error: error.message
    });
  }
};

// @desc    Revoke credential
// @route   POST /api/issuer/revoke/:credentialId
// @access  Private (Issuer only)
const revokeCredential = async (req, res) => {
  try {
    const { credentialId } = req.params;
    const { reason } = req.body;
    const issuerDID = req.user.did;

    const credential = await Credential.findOne({ credentialId, issuerDID });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    if (credential.status === 'revoked') {
      return res.status(400).json({
        success: false,
        message: 'Credential already revoked'
      });
    }

    // Revoke on blockchain (simulation)
    const Revocation = require('../models/Revocation');
    const revocation = await Revocation.create({
      credentialId,
      revRegId: `revReg_${uuidv4()}`,
      revRegDefId: `revRegDef_${uuidv4()}`,
      credRevId: `credRev_${uuidv4()}`,
      issuerDID,
      holderDID: credential.holderDID,
      reason,
      revokedBy: req.user._id
    });

    // Update credential
    credential.status = 'revoked';
    credential.revokedAt = new Date();
    credential.revocationReason = reason;
    await credential.save();

    // Log activity
    await logActivity({
      userId: req.user._id,
      userDID: issuerDID,
      activityType: 'credential_revoked',
      credentialId,
      relatedUserDID: credential.holderDID,
      status: 'success',
      metadata: { reason }
    });

    res.status(200).json({
      success: true,
      message: 'Credential revoked successfully',
      data: {
        credential,
        revocation
      }
    });
  } catch (error) {
    console.error('Revoke credential error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke credential',
      error: error.message
    });
  }
};

module.exports = {
  getPendingRequests,
  issueCredentialToHolder,
  getIssuedCredentials,
  revokeCredential
};