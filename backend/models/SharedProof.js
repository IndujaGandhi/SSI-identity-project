const mongoose = require('mongoose');

const SharedProofSchema = new mongoose.Schema({
  credentialId: { type: String, required: true },
  credentialType: { type: String },
  holderDID: { type: String, required: true },
  verifierDID: { type: String, required: true },
  proof: { type: Object, required: true },
  revealedAttributes: { type: Map, of: String },
  hiddenAttributesCount: { type: Number },
  issuerDID: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SharedProof', SharedProofSchema);