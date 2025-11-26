import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { AuthRequest, ApiResponse } from '../types';

interface JWTPayload {
  id: string;
  employeeId: string;
  email: string;
  role: string;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = (req as any).headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      } as ApiResponse);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Get user with role permissions
    const userQuery = `
      SELECT u.id, u.employee_id, u.email, u.role_id, u.is_active,
             r.permissions, r.inherits_from
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1 AND u.is_active = true
    `;
    const userResult = await query(userQuery, [decoded.id]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive.'
      } as ApiResponse);
    }

    const user = userResult.rows[0];

    // Get inherited permissions
    let allPermissions = [...user.permissions];

    if (user.inherits_from && user.inherits_from.length > 0) {
      for (const inheritedRoleId of user.inherits_from) {
        const inheritedQuery = 'SELECT permissions FROM roles WHERE id = $1';
        const inheritedResult = await query(inheritedQuery, [inheritedRoleId]);
        if (inheritedResult.rows.length > 0) {
          allPermissions = [...allPermissions, ...inheritedResult.rows[0].permissions];
        }
      }
    }

    // Remove duplicates
    allPermissions = [...new Set(allPermissions)];

    (req as any).user = {
      id: user.id,
      employeeId: user.employee_id,
      email: user.email,
      role: user.role_id,
      permissions: allPermissions
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid token.'
    } as ApiResponse);
  }
};

export const authorize = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      } as ApiResponse);
    }

    // Check if user has super-admin role (wildcard access)
    if (user.role === 'super-admin' || user.permissions.includes('system.*')) {
      return next();
    }

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(permission => {
      // Check exact match
      if (user.permissions.includes(permission)) {
        return true;
      }

      // Check wildcard permissions (e.g., 'employees.*' covers 'employees.view')
      const permissionParts = permission.split('.');
      const wildcardPermission = `${permissionParts[0]}.*`;

      return user.permissions.includes(wildcardPermission);
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Insufficient permissions.'
      } as ApiResponse);
    }

    next();
  };
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      } as ApiResponse);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Role not authorized.'
      } as ApiResponse);
    }

    next();
  };
};
