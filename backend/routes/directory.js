// backend/routes/directory.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   GET /api/directory/issuers
// @desc    Get all issuers with search and filter
// @access  Public
router.get('/issuers', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;
    
    let query = { role: 'issuer' };

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== '') {
      query.category = category;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);

    const issuers = await User.find(query)
      .select('name email did organization category description issuedCredentialsCount createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: issuers,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: issuers.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error fetching issuers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issuers',
      error: error.message
    });
  }
});

// @route   GET /api/directory/issuers/:did
// @desc    Get issuer by DID
// @access  Public
router.get('/issuers/:did', async (req, res) => {
  try {
    const issuer = await User.findOne({ 
      did: req.params.did,
      role: 'issuer'
    }).select('name email did organization category description issuedCredentialsCount createdAt');

    if (!issuer) {
      return res.status(404).json({
        success: false,
        message: 'Issuer not found'
      });
    }

    res.json({
      success: true,
      data: issuer
    });
  } catch (error) {
    console.error('Error fetching issuer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issuer details',
      error: error.message
    });
  }
});

// @route   GET /api/directory/categories
// @desc    Get all issuer categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await User.distinct('category', { role: 'issuer' });
    
    res.json({
      success: true,
      data: categories.filter(cat => cat && cat.trim() !== '')
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// @route   GET /api/directory/verifiers
// @desc    Get all verifiers with search
// @access  Public
router.get('/verifiers', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    let query = { role: 'verifier' };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } },
        { did: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);

    const verifiers = await User.find(query)
      .select('username email did organization createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: verifiers,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: verifiers.length,
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching verifiers', error: error.message });
  }
});

module.exports = router;