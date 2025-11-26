import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { User } from '../types';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(user: { id: string; employeeId: string; email: string; role: string }): string {
    const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    return jwt.sign(
      {
        id: user.id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as any
    );
  }

  static async login(email: string, password: string) {
    const userQuery = `
      SELECT u.id, u.employee_id, u.email, u.password_hash, u.role_id, u.is_active, u.last_login,
             e.first_name, e.last_name, e.status
      FROM users u
      JOIN employees e ON u.employee_id = e.id
      WHERE u.email = $1
    `;

    const result = await query(userQuery, [email]);

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    if (user.status !== 'Active') {
      throw new Error('Employee account is not active');
    }

    const isValidPassword = await this.comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Get user permissions for token
    const roleQuery = 'SELECT permissions, inherits_from FROM roles WHERE id = $1';
    const roleResult = await query(roleQuery, [user.role_id]);

    if (roleResult.rows.length === 0) {
      throw new Error('Role not found');
    }

    const role = roleResult.rows[0];
    let permissions = [...role.permissions];

    // Add inherited permissions
    if (role.inherits_from && role.inherits_from.length > 0) {
      for (const inheritedRoleId of role.inherits_from) {
        const inheritedResult = await query('SELECT permissions FROM roles WHERE id = $1', [inheritedRoleId]);
        if (inheritedResult.rows.length > 0) {
          permissions = [...permissions, ...inheritedResult.rows[0].permissions];
        }
      }
    }

    const token = this.generateToken({
      id: user.id,
      employeeId: user.employee_id,
      email: user.email,
      role: user.role_id
    });

    return {
      user: {
        id: user.id,
        employeeId: user.employee_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_id,
        permissions: [...new Set(permissions)]
      },
      token
    };
  }

  static async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
    const result = await query(userQuery, [userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const isValidOldPassword = await this.comparePassword(oldPassword, result.rows[0].password_hash);

    if (!isValidOldPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedNewPassword = await this.hashPassword(newPassword);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, userId]
    );

    return { success: true, message: 'Password changed successfully' };
  }

  static async resetPassword(employeeId: string, newPassword: string) {
    const hashedPassword = await this.hashPassword(newPassword);

    const result = await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $2 RETURNING id',
      [hashedPassword, employeeId]
    );

    if (result.rows.length === 0) {
      throw new Error('Employee not found');
    }

    return { success: true, message: 'Password reset successfully' };
  }

  static async createUser(employeeId: string, email: string, password: string, roleId: string) {
    const hashedPassword = await this.hashPassword(password);

    const result = await query(
      `INSERT INTO users (employee_id, email, password_hash, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, employee_id, email, role_id, created_at`,
      [employeeId, email, hashedPassword, roleId]
    );

    return result.rows[0];
  }

  static async updateUserRole(employeeId: string, newRoleId: string) {
    const result = await query(
      'UPDATE users SET role_id = $1, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $2 RETURNING id',
      [newRoleId, employeeId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return { success: true, message: 'User role updated successfully' };
  }

  static async deactivateUser(employeeId: string) {
    const result = await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE employee_id = $1 RETURNING id',
      [employeeId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return { success: true, message: 'User deactivated successfully' };
  }
}
