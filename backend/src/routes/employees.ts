import { Router } from 'express';
import { query } from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest, ApiResponse, Employee } from '../types';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all employees (with role-based filtering)
router.get('/', authorize('employees.view.all'), async (req, res) => {
  try {
    const { department, status, search, page = 1, limit = 10 } = req.query;
    const user = (req as any).user!;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Role-based filtering
    if (user.role === 'manager') {
      // Managers can only see their team members
      whereConditions.push(`e.manager_id = $${paramIndex}`);
      params.push(user.employeeId);
      paramIndex++;
    } else if (user.role === 'department-head') {
      // Department heads can see their department
      const deptQuery = await query('SELECT department_id FROM employees WHERE id = $1', [user.employeeId]);
      if (deptQuery.rows.length > 0) {
        whereConditions.push(`e.department_id = $${paramIndex}`);
        params.push(deptQuery.rows[0].department_id);
        paramIndex++;
      }
    }

    // Additional filters
    if (department) {
      whereConditions.push(`e.department_id = $${paramIndex}`);
      params.push(department);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`e.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(e.first_name ILIKE $${paramIndex} OR e.last_name ILIKE $${paramIndex} OR e.email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM employees e
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get employees with pagination
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const employeesQuery = `
      SELECT
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.date_of_birth,
        e.gender,
        e.address,
        e.department_id,
        d.name as department_name,
        e.position,
        e.role_id,
        e.manager_id,
        m.first_name as manager_first_name,
        m.last_name as manager_last_name,
        e.hire_date,
        e.employment_type,
        e.salary,
        e.status,
        e.created_at,
        e.updated_at
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employees m ON e.manager_id = m.id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(parseInt(limit as string), offset);
    const employeesResult = await query(employeesQuery, params);

    // Format the response
    const employees = employeesResult.rows.map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      address: row.address,
      department: row.department_name,
      departmentId: row.department_id,
      position: row.position,
      role: row.role_id,
      managerId: row.manager_id,
      managerName: row.manager_first_name && row.manager_last_name
        ? `${row.manager_first_name} ${row.manager_last_name}`
        : null,
      hireDate: row.hire_date,
      employmentType: row.employment_type,
      salary: row.salary,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({
      success: true,
      data: employees,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get employees',
    } as ApiResponse);
  }
});

// Create new employee
router.post('/', authorize('employees.create'), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      departmentId,
      position,
      roleId,
      hireDate,
      employmentType,
      salary,
      status,
      managerId,
      address,
    } = req.body;

    // Generate unique employee ID (EMP001, EMP002, etc.)
    const idQuery = await query("SELECT id FROM employees ORDER BY id DESC LIMIT 1");
    let nextId = 1;
    if (idQuery.rows.length > 0) {
      const lastId = idQuery.rows[0].id;
      const numPart = parseInt(lastId.replace('EMP', ''));
      nextId = numPart + 1;
    }
    const employeeId = `EMP${nextId.toString().padStart(3, '0')}`;

    // Generate employee ID (TC001, TC002, etc.)
    const employeeIdQuery = await query("SELECT employee_id FROM employees ORDER BY employee_id DESC LIMIT 1");
    let nextEmployeeId = 1;
    if (employeeIdQuery.rows.length > 0) {
      const lastEmployeeId = employeeIdQuery.rows[0].employee_id;
      const numPart = parseInt(lastEmployeeId.replace('TC', ''));
      nextEmployeeId = numPart + 1;
    }
    const uniqueEmployeeId = `TC${nextEmployeeId.toString().padStart(3, '0')}`;

    const insertQuery = `
      INSERT INTO employees (
        id, employee_id, first_name, last_name, email, phone,
        date_of_birth, gender, department_id, position, role_id,
        hire_date, employment_type, salary, status,
        manager_id, address, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const params = [
      employeeId,
      uniqueEmployeeId,
      firstName,
      lastName,
      email,
      phone || null,
      dateOfBirth || null,
      gender || null,
      departmentId,
      position,
      roleId || null,
      hireDate,
      employmentType,
      salary,
      status || 'Active',
      managerId || null,
      address
    ];

    const result = await query(insertQuery, params);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Employee created successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create employee',
    } as ApiResponse);
  }
});

// Get employee by ID
router.get('/:id', authorize('employees.view.self'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user!;

    // Check if user can view this employee
    if (user.role !== 'super-admin' && user.role !== 'hr-admin' && user.role !== 'hr-specialist') {
      if (user.role === 'manager') {
        // Check if the employee is in their team
        const teamCheck = await query(
          'SELECT id FROM employees WHERE id = $1 AND manager_id = $2',
          [id, user.employeeId]
        );
        if (teamCheck.rows.length === 0 && id !== user.employeeId) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. Can only view team members.',
          } as ApiResponse);
        }
      } else if (user.role === 'department-head') {
        // Check if employee is in same department
        const deptCheck = await query(
          `SELECT e.id FROM employees e
           JOIN employees u ON u.id = $2
           WHERE e.id = $1 AND e.department_id = u.department_id`,
          [id, user.employeeId]
        );
        if (deptCheck.rows.length === 0 && id !== user.employeeId) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. Can only view department members.',
          } as ApiResponse);
        }
      } else if (id !== user.employeeId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Can only view own profile.',
        } as ApiResponse);
      }
    }

    const employeeQuery = `
      SELECT
        e.*,
        d.name as department_name,
        m.first_name as manager_first_name,
        m.last_name as manager_last_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employees m ON e.manager_id = m.id
      WHERE e.id = $1
    `;

    const result = await query(employeeQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      } as ApiResponse);
    }

    const row = result.rows[0];
    const employee = {
      id: row.id,
      employeeId: row.employee_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      address: row.address,
      department: row.department_name,
      departmentId: row.department_id,
      position: row.position,
      role: row.role_id,
      managerId: row.manager_id,
      managerName: row.manager_first_name && row.manager_last_name
        ? `${row.manager_first_name} ${row.manager_last_name}`
        : null,
      hireDate: row.hire_date,
      employmentType: row.employment_type,
      salary: row.salary,
      status: row.status,
      emergencyContact: row.emergency_contact,
      bankDetails: row.bank_details,
      skills: row.skills,
      education: row.education,
      certifications: row.certifications,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json({
      success: true,
      data: employee,
    } as ApiResponse);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get employee',
    } as ApiResponse);
  }
});

// Update employee
router.put('/:id', authorize('employees.edit.self'), async (req, res) => {
  try {
    const { id } = req.params;
    let updates = req.body;
    const user = (req as any).user!;

    // Check permissions for editing
    if (user.role !== 'super-admin' && user.role !== 'hr-admin') {
      if (user.role === 'manager') {
        const teamCheck = await query(
          'SELECT id FROM employees WHERE id = $1 AND manager_id = $2',
          [id, user.employeeId]
        );
        if (teamCheck.rows.length === 0 && id !== user.employeeId) {
          return res.status(403).json({
            success: false,
            error: 'Access denied. Can only edit team members.',
          } as ApiResponse);
        }
        // Managers can only edit limited fields
        const allowedFields = ['phone', 'address', 'emergency_contact', 'skills', 'education', 'certifications'];
        const filteredUpdates = Object.keys(updates)
          .filter(key => allowedFields.includes(key))
          .reduce((obj, key) => {
            obj[key] = updates[key];
            return obj;
          }, {} as any);
        if (Object.keys(filteredUpdates).length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No editable fields provided',
          } as ApiResponse);
        }
        updates = filteredUpdates;
      } else if (id !== user.employeeId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Can only edit own profile.',
        } as ApiResponse);
      }
    }

    // Map frontend field names to database column names and filter out invalid fields
    const fieldMapping: { [key: string]: string } = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      phone: 'phone',
      dateOfBirth: 'date_of_birth',
      gender: 'gender',
      address: 'address',
      departmentId: 'department_id',
      position: 'position',
      roleId: 'role_id',
      managerId: 'manager_id',
      hireDate: 'hire_date',
      employmentType: 'employment_type',
      salary: 'salary',
      status: 'status',
      emergencyContact: 'emergency_contact',
      bankDetails: 'bank_details',
      skills: 'skills',
      education: 'education',
      certifications: 'certifications'
    };

    // Filter and map the updates
    const validUpdates: { [key: string]: any } = {};
    Object.keys(updates).forEach(key => {
      if (fieldMapping[key] && updates[key] !== undefined) {
        let value = updates[key];

        // Handle special cases
        if (key === 'salary' && value !== null && value !== '') {
          value = parseFloat(value);
        }
        if (key === 'hireDate' && value) {
          value = new Date(value).toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
        }
        if (key === 'dateOfBirth' && value) {
          value = new Date(value).toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
        }

        // Convert empty strings to null for optional fields
        if (value === '' && ['phone', 'gender', 'roleId', 'managerId'].includes(key)) {
          value = null;
        }

        validUpdates[fieldMapping[key]] = value;
      }
    });

    if (Object.keys(validUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
      } as ApiResponse);
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    Object.keys(validUpdates).forEach(key => {
      updateFields.push(`${key} = $${paramIndex}`);
      params.push(validUpdates[key]);
      paramIndex++;
    });

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE employees
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    params.push(id);
    const result = await query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Employee updated successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update employee',
    } as ApiResponse);
  }
});

// Get managers by department
router.get('/managers/:departmentId', authorize('employees.view.all'), async (req, res) => {
  try {
    const { departmentId } = req.params;

    const managersQuery = `
      SELECT
        e.id,
        e.first_name,
        e.last_name,
        e.position,
        e.role_id
      FROM employees e
      WHERE e.department_id = $1
        AND e.status = 'Active'
        AND e.position IN (
          'CEO', 'VP of Engineering', 'VP of Product', 'VP of Sales',
          'HR Director', 'CFO', 'Engineering Director', 'HR Manager',
          'Payroll Manager', 'Finance Manager', 'Team Lead'
        )
      ORDER BY
        CASE
          WHEN e.position = 'CEO' THEN 1
          WHEN e.position LIKE 'VP%' THEN 2
          WHEN e.position LIKE '%Director' THEN 3
          WHEN e.position LIKE '%Manager' THEN 4
          WHEN e.position = 'Team Lead' THEN 5
          ELSE 6
        END,
        e.first_name, e.last_name
    `;

    const result = await query(managersQuery, [departmentId]);

    const managers = result.rows.map(row => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name}`,
      position: row.position,
      roleId: row.role_id,
    }));

    res.json({
      success: true,
      data: managers,
    } as ApiResponse);
  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get managers',
    } as ApiResponse);
  }
});

// Get employee documents
router.get('/:id/documents', authorize('employees.view.self'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user!;

    // Check permissions
    if (!user.permissions.includes('employees.view.all') && id !== user.employeeId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
    }

    const documentsQuery = `
      SELECT d.*, e.first_name, e.last_name
      FROM documents d
      JOIN employees e ON d.employee_id = e.id
      WHERE d.employee_id = $1
      ORDER BY d.uploaded_at DESC
    `;

    const result = await query(documentsQuery, [id]);

    res.json({
      success: true,
      data: result.rows,
    } as ApiResponse);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get documents',
    } as ApiResponse);
  }
});

export default router;
