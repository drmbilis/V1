const express = require('express');
const router = express.Router();
const { User, Tenant, TenantUser, GoogleAccount, GoogleCustomer } = require('../../models');
const googleAuthService = require('./googleAuth.service');
const { generateToken } = require('../../utils/jwt');
const { syncQueue } = require('../jobs/queues');
const { authenticate } = require('../../middleware/auth');

const handleGoogleStart = (req, res) => {
  try {
    const authUrl = googleAuthService.getAuthUrl();
    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @route   GET /api/v1/auth/google
// @desc    Get Google OAuth URL (alias)
// @access  Public
router.get('/google', handleGoogleStart);

// @route   GET /api/v1/auth/google/start
// @desc    Get Google OAuth URL
// @access  Public
router.get('/google/start', handleGoogleStart);

// @route   GET /api/v1/auth/google/callback
// @desc    Handle Google OAuth callback
// @access  Public
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }

    // Get tokens from Google
    const tokens = await googleAuthService.getTokens(code);
    
    // Get user info
    const userInfo = await googleAuthService.getUserInfo(tokens.access_token);

    // Find or create user
    let user = await User.findOne({ where: { googleId: userInfo.id } });

    let tenant;
    let isNewUser = false;

    if (!user) {
      // Create new user and tenant
      user = await User.create({
        email: userInfo.email,
        name: userInfo.name,
        googleId: userInfo.id,
        lastLoginAt: new Date()
      });

      tenant = await Tenant.create({
        name: `${userInfo.name}'s Workspace`,
        isActive: true
      });

      await TenantUser.create({
        tenantId: tenant.id,
        userId: user.id,
        role: 'admin',
        isActive: true
      });

      isNewUser = true;
    } else {
      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Get user's default tenant
      const tenantUser = await TenantUser.findOne({
        where: { userId: user.id, isActive: true },
        include: [{ model: Tenant, as: 'tenant' }]
      });

      tenant = tenantUser?.tenant;
    }

    if (!tenant) {
      throw new Error('No tenant found for user');
    }

    // Save or update Google account
    const [googleAccount] = await GoogleAccount.findOrCreate({
      where: {
        tenantId: tenant.id,
        googleUserEmail: userInfo.email
      },
      defaults: {
        refreshTokenEnc: '', // Will be set below
        scopes: tokens.scope?.split(' ') || [],
        status: 'active'
      }
    });

    googleAccount.setRefreshToken(tokens.refresh_token);
    googleAccount.scopes = tokens.scope?.split(' ') || [];
    googleAccount.status = 'active';
    await googleAccount.save();

    // Queue sync customers job
    await syncQueue.add('sync_customers', {
      type: 'sync_customers',
      tenantId: tenant.id
    });

    // Generate JWT
    const jwtToken = generateToken(user.id, user.email, tenant.id);

    // Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}&new_user=${isNewUser}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
  }
});

// @route   POST /api/v1/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @route   GET /api/v1/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: TenantUser,
        as: 'tenantMemberships',
        where: { isActive: true },
        include: [{
          model: Tenant,
          as: 'tenant'
        }]
      }]
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
