const express = require('express');
const router = express.Router();

const {
  User,
  Tenant,
  TenantUser,
  GoogleAccount,
} = require('../../models');

const googleAuthService = require('./googleAuth.service');
const { generateToken } = require('../../utils/jwt');
const { syncQueue } = require('../jobs/queues');
const { authenticate } = require('../../middleware/auth');

/**
 * ======================================================
 * GOOGLE AUTH START (REDIRECT)
 * GET /api/v1/auth/google
 * ======================================================
 */
router.get('/google', (req, res) => {
  try {
    const authUrl = googleAuthService.getAuthUrl();
    return res.redirect(authUrl);
  } catch (error) {
    console.error('Google auth redirect error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * ======================================================
 * GOOGLE AUTH START (JSON)
 * GET /api/v1/auth/google/start
 * ======================================================
 */
router.get('/google/start', (req, res) => {
  try {
    const authUrl = googleAuthService.getAuthUrl();

    return res.json({
      success: true,
      data: { authUrl },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * ======================================================
 * GOOGLE CALLBACK
 * GET /api/v1/auth/google/callback
 * ======================================================
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      });
    }

    /* Get tokens */
    const tokens = await googleAuthService.getTokens(code);

    /* Get user info */
    const userInfo = await googleAuthService.getUserInfo(
      tokens.access_token
    );

    /* Find user */
    let user = await User.findOne({
      where: { googleId: userInfo.id },
    });

    let tenant;
    let isNewUser = false;

    /* Create user if not exists */
    if (!user) {
      user = await User.create({
        email: userInfo.email,
        name: userInfo.name,
        googleId: userInfo.id,
        lastLoginAt: new Date(),
      });

      tenant = await Tenant.create({
        name: `${userInfo.name}'s Workspace`,
        isActive: true,
      });

      await TenantUser.create({
        tenantId: tenant.id,
        userId: user.id,
        role: 'admin',
        isActive: true,
      });

      isNewUser = true;
    } else {
      /* Update last login */
      user.lastLoginAt = new Date();
      await user.save();

      const tenantUser = await TenantUser.findOne({
        where: {
          userId: user.id,
          isActive: true,
        },
        include: [
          {
            model: Tenant,
            as: 'tenant',
          },
        ],
      });

      tenant = tenantUser?.tenant;
    }

    if (!tenant) {
      throw new Error('No tenant found for user');
    }

    /* Save Google account */
    const [googleAccount] = await GoogleAccount.findOrCreate({
      where: {
        tenantId: tenant.id,
        googleUserEmail: userInfo.email,
      },
      defaults: {
        refreshTokenEnc: '',
        scopes: tokens.scope?.split(' ') || [],
        status: 'active',
      },
    });

    googleAccount.setRefreshToken(tokens.refresh_token);
    googleAccount.scopes = tokens.scope?.split(' ') || [];
    googleAccount.status = 'active';

    await googleAccount.save();

    /* Queue sync job */
    await syncQueue.add('sync_customers', {
      type: 'sync_customers',
      tenantId: tenant.id,
    });

    /* Generate JWT */
    const jwtToken = generateToken(
      user.id,
      user.email,
      tenant.id
    );

    /* Redirect frontend */
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';

    return res.redirect(
      `${frontendUrl}/auth/callback?token=${jwtToken}&new_user=${isNewUser}`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);

    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';

    return res.redirect(
      `${frontendUrl}/auth/error?message=${encodeURIComponent(
        error.message
      )}`
    );
  }
});

/**
 * ======================================================
 * LOGOUT
 * POST /api/v1/auth/logout
 * ======================================================
 */
router.post('/logout', authenticate, async (req, res) => {
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * ======================================================
 * CURRENT USER
 * GET /api/v1/auth/me
 * ======================================================
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: {
        exclude: ['password'],
      },
      include: [
        {
          model: TenantUser,
          as: 'tenantMemberships',
          where: {
            isActive: true,
          },
          include: [
            {
              model: Tenant,
              as: 'tenant',
            },
          ],
        },
      ],
    });

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
