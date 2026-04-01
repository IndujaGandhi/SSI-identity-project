const express = require('express');
const router = express.Router();
const {
  verifyCredentialSubmission,
  getVerificationHistory,
  checkRevocationStatus,
  getSharedProofs
} = require('../controllers/verifierController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.post('/verify', protect, checkRole('verifier'), verifyCredentialSubmission);
router.get('/history', protect, checkRole('verifier'), getVerificationHistory);
router.get('/check-revocation/:credentialId', protect, checkRole('verifier'), checkRevocationStatus);
router.get('/shared-proofs', protect, checkRole('verifier'), getSharedProofs);

module.exports = router;