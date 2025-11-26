import { Router } from 'express';
import { AuthService } from '../services/authService';
import { authenticate } from '../middleware/auth';
import { AuthRequest, ApiResponse } from '../types';

const router = Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      } as ApiResponse);
    }

    const result = await AuthService.login(email, password);

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    } as ApiResponse);
  }
});

// Change password route (requires authentication)
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = (req as any).user!.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Old password and new password are required'
      } as ApiResponse);
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      } as ApiResponse);
    }

    const result = await AuthService.changePassword(userId, oldPassword, newPassword);

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Password change failed'
    } as ApiResponse);
  }
});

// Reset password route (for HR/admin use)
router.post('/reset-password/:employeeId', authenticate, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { employeeId } = req.params;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password is required'
      } as ApiResponse);
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      } as ApiResponse);
    }

    const result = await AuthService.resetPassword(employeeId, newPassword);

    res.json({
      success: true,
      data: result
    } as ApiResponse);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Password reset failed'
    } as ApiResponse);
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const userQuery = `
      SELECT
        u.id,
        u.employee_id,
        u.email,
        u.role_id,
        u.last_login,
        e.first_name,
        e.last_name,
        e.position,
        e.department_id,
        e.status
      FROM users u
      JOIN employees e ON u.employee_id = e.id
      WHERE u.id = $1
    `;

    const result = await req.app.locals.query(userQuery, [(req as any).user!.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        employeeId: user.employee_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        position: user.position,
        department: user.department_id,
        role: user.role_id,
        status: user.status,
        lastLogin: user.last_login
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    } as ApiResponse);
  }
});

export default router;
