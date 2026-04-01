const Credential = require('../models/Credential');
const Revocation = require('../models/Revocation');
const { verifyCredential } = require('../services/blockchainService');
const { verifySelectiveDisclosureProof } = require('../services/zkpService');
const { logActivity } = require('../utils/logger');

// @desc    Verify credential
// @route   POST /api/verifier/verify
// @access  Private (Verifier only)
const verifyCredentialSubmission = async (req, res) => {
  try {
    const { credentialId, proof, revealedAttributes } = req.body;
    const verifierDID = req.user.did;

    // Find credential
    const credential = await Credential.findOne({ credentialId });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found',
        verified: false
      });
    }

    // Check if credential is revoked
    const isRevoked = await Revocation.findOne({ credentialId, isActive: true });
    
    if (isRevoked) {
      await logActivity({
        userId: req.user._id,
        userDID: verifierDID,
        activityType: 'credential_verified',
        credentialId,
        relatedUserDID: credential.holderDID,
        status: 'failed',
        errorMessage: 'Credential is revoked'
      });

      return res.status(400).json({
        success: false,
        message: 'Credential has been revoked',
        verified: false,
        revocationDetails: {
          revokedAt: isRevoked.revokedAt,
          reason: isRevoked.reason
        }
      });
    }

    // Verify ZKP if provided
    let zkpVerification = null;
    if (proof && revealedAttributes) {
      zkpVerification = await verifySelectiveDisclosureProof(proof, revealedAttributes);
      
      if (!zkpVerification.verified) {
        await logActivity({
          userId: req.user._id,
          userDID: verifierDID,
          activityType: 'credential_verified',
          credentialId,
          relatedUserDID: credential.holderDID,
          status: 'failed',
          errorMessage: 'ZKP verification failed'
        });

        return res.status(400).json({
          success: false,
          message: 'Zero-knowledge proof verification failed',
          verified: false
        });
      }
    }

    // Verify credential on blockchain
    const blockchainVerification = await verifyCredential(
      credential,
      credential.credDefId
    );

    const isVerified = blockchainVerification.verified && credential.status === 'issued';

    // Log activity
    await logActivity({
      userId: req.user._id,
      userDID: verifierDID,
      activityType: 'credential_verified',
      credentialId,
      relatedUserDID: credential.holderDID,
      status: isVerified ? 'success' : 'failed',
      metadata: {
        zkpVerified: zkpVerification?.verified || false,
        blockchainVerified: blockchainVerification.verified
      }
    });

    res.status(200).json({
      success: true,
      verified: isVerified,
      message: isVerified ? 'Credential verified successfully' : 'Credential verification failed',
      data: {
        credentialId,
        credentialType: credential.credentialType,
        issuerDID: credential.issuerDID,
        holderDID: credential.holderDID,
        issuedAt: credential.issuedAt,
        status: credential.status,
        revealedAttributes: revealedAttributes || {},
        zkpVerification,
        blockchainVerification,
        verifiedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Verify credential error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify credential',
      verified: false,
      error: error.message
    });
  }
};

// @desc    Get verification history
// @route   GET /api/verifier/history
// @access  Private (Verifier only)
const getVerificationHistory = async (req, res) => {
  try {
    const verifierDID = req.user.did;
    const Activity = require('../models/Activity');

    const history = await Activity.find({
      userDID: verifierDID,
      activityType: 'credential_verified'
    })
      .sort({ timestamp: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification history',
      error: error.message
    });
  }
};

// @desc    Check credential revocation status
// @route   GET /api/verifier/check-revocation/:credentialId
// @access  Private (Verifier only)
const checkRevocationStatus = async (req, res) => {
  try {
    const { credentialId } = req.params;

    const credential = await Credential.findOne({ credentialId });
    
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    const revocation = await Revocation.findOne({ credentialId, isActive: true });

    res.status(200).json({
      success: true,
      data: {
        credentialId,
        isRevoked: !!revocation,
        status: credential.status,
        revocationDetails: revocation ? {
          revokedAt: revocation.revokedAt,
          reason: revocation.reason,
          revokedBy: revocation.revokedBy
        } : null
      }
    });
  } catch (error) {
    console.error('Check revocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check revocation status',
      error: error.message
    });
  }
};

// @desc    Get all proofs shared with this verifier
// @route   GET /api/verifier/shared-proofs
// @access  Private (Verifier only)
const getSharedProofs = async (req, res) => {
  try {
    const verifierDID = req.user.did;
    const SharedProof = require('../models/SharedProof');

    const proofs = await SharedProof.find({ verifierDID }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: proofs.length,
      data: proofs
    });
  } catch (error) {
    console.error('Get shared proofs error:', error);
    res.status(500).json({ success: false, message: 'Failed to get shared proofs', error: error.message });
  }
};

module.exports = {
  verifyCredentialSubmission,
  getVerificationHistory,
  checkRevocationStatus,
  getSharedProofs
};