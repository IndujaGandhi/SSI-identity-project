// Simulated IPFS Service - MongoDB backed (persistent)
const { encrypt, decrypt } = require('../utils/encryption');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// MongoDB schema for persistent IPFS storage
const IPFSStorageSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  encryptedData: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const IPFSStorage = mongoose.models.IPFSStorage || 
  mongoose.model('IPFSStorage', IPFSStorageSchema);

// Upload encrypted data to "IPFS" (MongoDB backed)
const uploadToIPFS = async (data) => {
  try {
    console.log('📤 Attempting to upload to IPFS...');

    if (!data) throw new Error('No data provided for IPFS upload');

    let encryptedData;
    try {
      encryptedData = encrypt(data);
      console.log('✅ Data encrypted successfully');
    } catch (encryptError) {
      throw new Error('Failed to encrypt data: ' + encryptError.message);
    }

    const ipfsHash = `Qm${uuidv4().replace(/-/g, '')}`;

    // Store in MongoDB (persistent)
    await IPFSStorage.create({ hash: ipfsHash, encryptedData });

    console.log(`✅ [SIMULATION] Data uploaded to IPFS: ${ipfsHash}`);
    return ipfsHash;
  } catch (error) {
    console.error('❌ IPFS upload error:', error);
    throw new Error('Failed to upload to IPFS: ' + error.message);
  }
};

// Retrieve and decrypt data from "IPFS" (MongoDB backed)
const retrieveFromIPFS = async (hash) => {
  try {
    console.log(`📥 Attempting to retrieve from IPFS: ${hash}`);

    const stored = await IPFSStorage.findOne({ hash });

    if (!stored) {
      console.error(`❌ Data not found for hash: ${hash}`);
      throw new Error('Data not found in IPFS');
    }

    let decryptedData;
    try {
      decryptedData = decrypt(stored.encryptedData);
      console.log('✅ Data decrypted successfully');
    } catch (decryptError) {
      throw new Error('Failed to decrypt data: ' + decryptError.message);
    }

    console.log(`✅ [SIMULATION] Data retrieved from IPFS: ${hash}`);
    return decryptedData;
  } catch (error) {
    console.error('❌ IPFS retrieval error:', error);
    throw new Error('Failed to retrieve from IPFS: ' + error.message);
  }
};

const checkIPFSStatus = async () => {
  const count = await IPFSStorage.countDocuments();
  return {
    status: 'connected (simulation)',
    version: 'simulated-1.0.0',
    mode: 'mongodb-storage',
    itemsStored: count
  };
};

module.exports = {
  uploadToIPFS,
  retrieveFromIPFS,
  checkIPFSStatus
};