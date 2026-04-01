const Credential = require('../models/Credential');
const { retrieveFromIPFS } = require('../services/ipfsService');
const { generateSelectiveDisclosureProof, generateRangeProof } = require('../services/zkpService');
const { logActivity } = require('../utils/logger');

// @desc    Get holder dashboard stats
// @route   GET /api/holder/dashboard
// @access  Private (Holder only)
const getDashboard = async (req, res) => {
  try {
    const holderDID = req.user.did;

    const totalCredentials = await Credential.countDocuments({ holderDID });
    const issuedCredentials = await Credential.countDocuments({ holderDID, status: 'issued' });
    const pendingCredentials = await Credential.countDocuments({ holderDID, status: 'pending' });
    const revokedCredentials = await Credential.countDocuments({ holderDID, status: 'revoked' });

    const recentCredentials = await Credential.find({ holderDID })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total: totalCredentials,
          issued: issuedCredentials,
          pending: pendingCredentials,
          revoked: revokedCredentials
        },
        recentCredentials
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
};

// @desc    Share credential with verifier (with selective disclosure)
// @route   POST /api/holder/share/:credentialId
// @access  Private (Holder only)
const shareCredential = async (req, res) => {
  try {
    const { credentialId } = req.params;
    const { verifierDID, revealedAttributes } = req.body;
    const holderDID = req.user.did;

    const credential = await Credential.findOne({ credentialId, holderDID });
    if (!credential) {
      return res.status(404).json({ success: false, message: 'Credential not found' });
    }
    if (credential.status !== 'issued') {
      return res.status(400).json({ success: false, message: `Cannot share credential with status: ${credential.status}` });
    }

    const fullCredential = await retrieveFromIPFS(credential.ipfsHash);

    const zkpResult = await generateSelectiveDisclosureProof(
      { ...credential.toObject(), attributes: fullCredential.attributes },
      revealedAttributes || Object.keys(fullCredential.attributes)
    );

    // ✅ Save shared proof to MongoDB so verifier can see it
    const SharedProof = require('../models/SharedProof');
    await SharedProof.create({
      credentialId,
      credentialType: credential.credentialType,
      holderDID,
      verifierDID,
      proof: zkpResult.proof,
      revealedAttributes: zkpResult.revealedAttributes,
      hiddenAttributesCount: zkpResult.hiddenAttributesCount,
      issuerDID: credential.issuerDID
    });

    await logActivity({
      userId: req.user._id,
      userDID: holderDID,
      activityType: 'credential_shared',
      credentialId,
      relatedUserDID: verifierDID,
      status: 'success',
      metadata: {
        revealedAttributes: zkpResult.revealedAttributes,
        hiddenCount: zkpResult.hiddenAttributesCount
      }
    });

    res.status(200).json({
      success: true,
      message: 'Credential shared successfully',
      data: {
        credentialId,
        proof: zkpResult.proof,
        revealedAttributes: zkpResult.revealedAttributes,
        hiddenAttributesCount: zkpResult.hiddenAttributesCount,
        credDefId: credential.credDefId,
        issuerDID: credential.issuerDID
      }
    });
  } catch (error) {
    console.error('Share credential error:', error);
    res.status(500).json({ success: false, message: 'Failed to share credential', error: error.message });
  }
};

// @desc    Generate proof of age (ZKP range proof)
// @route   POST /api/holder/proof/age/:credentialId
// @access  Private (Holder only)
const generateAgeProof = async (req, res) => {
  try {
    const { credentialId } = req.params;
    const { minAge } = req.body;
    const holderDID = req.user.did;

    const credential = await Credential.findOne({ credentialId, holderDID });

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    // Retrieve full credential
    const fullCredential = await retrieveFromIPFS(credential.ipfsHash);

    // Generate range proof (age >= minAge)
    const proofResult = await generateRangeProof(
      { ...credential.toObject(), attributes: fullCredential.attributes },
      'age',
      '>=',
      minAge
    );

    res.status(200).json({
      success: true,
      message: 'Age proof generated successfully',
      data: proofResult
    });
  } catch (error) {
    console.error('Age proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate age proof',
      error: error.message
    });
  }
};

module.exports = {
  getDashboard,
  shareCredential,
  generateAgeProof
};