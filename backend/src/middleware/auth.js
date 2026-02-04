const { verifyToken } = require('../utils/jwt');
const { User, TenantUser, Tenant } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    // Get tenant context
    const tenantUser = await TenantUser.findOne({
      where: {
        userId: user.id,
        tenantId: decoded.tenantId,
        isActive: true
      },
      include: [{
        model: Tenant,
        as: 'tenant'
      }]
    });

    if (!tenantUser) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized for this tenant'
      });
    }

    req.user = user;
    req.tenant = tenantUser.tenant;
    req.userRole = tenantUser.role;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  requireRole
};
