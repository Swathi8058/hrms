import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { AuthRequest, ApiResponse, Employee } from '../types';
import { query } from '../config/database';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get organizational structure
router.get('/structure', authorize('employees.view.all'), async (req, res) => {
  try {
    // Get all employees with their reporting relationships
    const employeesQuery = `
      SELECT
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.position,
        e.role_id,
        e.department_id,
        d.name as department_name,
        e.manager_id,
        e.status
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.status IN ('Active', 'Pending Onboarding')
      ORDER BY e.hire_date ASC
    `;

    const employeesResult = await query(employeesQuery);
    const employees = employeesResult.rows;

    // Get departments structure
    const departmentsQuery = `
      SELECT
        d.id,
        d.name,
        d.description,
        d.head_role,
        d.location,
        d.functions,
        d.sub_departments,
        e.first_name as head_first_name,
        e.last_name as head_last_name,
        e.id as head_employee_id
      FROM departments d
      LEFT JOIN employees e ON d.head_role = e.position
      ORDER BY d.name ASC
    `;

    const departmentsResult = await query(departmentsQuery);
    const departments = departmentsResult.rows;

    // Build organizational hierarchy
    const hierarchy = buildHierarchy(employees);

    res.json({
      success: true,
      data: {
        hierarchy,
        departments,
        employees
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get organization structure error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get organization structure',
    } as ApiResponse);
  }
});

// Get reporting chain for an employee
router.get('/:employeeId/reporting-chain', authorize('employees.view.self'), async (req, res) => {
  try {
    const { employeeId } = req.params;
    const user = (req as any).user!;

    // Check permissions
    if (!user.permissions.includes('employees.view.all') && employeeId !== user.employeeId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      } as ApiResponse);
    }

    // Get upward reporting chain
    const upwardChain = await getUpwardChain(employeeId);

    // Get downward reporting chain
    const downwardChain = await getDownwardChain(employeeId);

    res.json({
      success: true,
      data: {
        employeeId,
        upward: upwardChain,
        downward: downwardChain
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get reporting chain error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reporting chain',
    } as ApiResponse);
  }
});

// Search employees by criteria
router.get('/search', authorize('employees.view.all'), async (req, res) => {
  try {
    const { q, department, role, position } = req.query;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (q) {
      whereConditions.push(`(e.first_name ILIKE $${paramIndex} OR e.last_name ILIKE $${paramIndex} OR e.position ILIKE $${paramIndex})`);
      params.push(`%${q}%`);
      paramIndex++;
    }

    if (department) {
      whereConditions.push(`e.department_id = $${paramIndex}`);
      params.push(department);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`e.role_id = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (position) {
      whereConditions.push(`e.position ILIKE $${paramIndex}`);
      params.push(`%${position}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const searchQuery = `
      SELECT
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.email,
        e.position,
        e.role_id,
        e.department_id,
        d.name as department_name,
        e.manager_id,
        e.status,
        e.hire_date
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
      ORDER BY e.first_name, e.last_name
      LIMIT 50
    `;

    const result = await query(searchQuery, params);

    res.json({
      success: true,
      data: result.rows
    } as ApiResponse);
  } catch (error) {
    console.error('Search employees error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search employees',
    } as ApiResponse);
  }
});

// Get department details with employees
router.get('/departments/:departmentId', authorize('employees.view.all'), async (req, res) => {
  try {
    const { departmentId } = req.params;

    // Get department info
    const deptQuery = `
      SELECT
        d.*,
        e.first_name as head_first_name,
        e.last_name as head_last_name,
        e.id as head_employee_id
      FROM departments d
      LEFT JOIN employees e ON d.head_role = e.position
      WHERE d.id = $1
    `;

    const deptResult = await query(deptQuery, [departmentId]);

    if (deptResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      } as ApiResponse);
    }

    // Get employees in department
    const employeesQuery = `
      SELECT
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.position,
        e.role_id,
        e.status,
        e.manager_id,
        m.first_name as manager_first_name,
        m.last_name as manager_last_name
      FROM employees e
      LEFT JOIN employees m ON e.manager_id = m.id
      WHERE e.department_id = $1 AND e.status IN ('Active', 'Pending Onboarding')
      ORDER BY e.position, e.first_name
    `;

    const employeesResult = await query(employeesQuery, [departmentId]);

    res.json({
      success: true,
      data: {
        department: deptResult.rows[0],
        employees: employeesResult.rows
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get department details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get department details',
    } as ApiResponse);
  }
});

// Helper function to build hierarchy
function buildHierarchy(employees: any[]): any {
  const employeeMap = new Map();
  const rootNodes: any[] = [];

  // Create employee map
  employees.forEach(emp => {
    employeeMap.set(emp.id, {
      ...emp,
      children: [],
      subordinates: []
    });
  });

  // Build hierarchy
  employees.forEach(emp => {
    const employee = employeeMap.get(emp.id);

    if (emp.manager_id) {
      const manager = employeeMap.get(emp.manager_id);
      if (manager) {
        manager.children.push(employee);
        employee.manager = {
          id: manager.id,
          name: `${manager.first_name} ${manager.last_name}`,
          position: manager.position
        };
      }
    } else {
      rootNodes.push(employee);
    }
  });

  return rootNodes;
}

// Helper function to get upward reporting chain
async function getUpwardChain(employeeId: string): Promise<any[]> {
  const chain: any[] = [];
  let currentId = employeeId;

  while (currentId) {
    const sqlQuery = `
      SELECT
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.position,
        e.role_id,
        d.name as department_name,
        e.manager_id
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `;

    const result = await query(sqlQuery, [currentId]);

    if (result.rows.length === 0) break;

    const employee = result.rows[0];
    chain.unshift({
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      position: employee.position,
      department: employee.department_name,
      role: employee.role_id
    });

    currentId = employee.manager_id;
  }

  return chain;
}

// Helper function to get downward reporting chain
async function getDownwardChain(employeeId: string): Promise<any[]> {
  const chain: any[] = [];
  const queue = [employeeId];
  const visited = new Set();

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const sqlQuery2 = `
      SELECT
        e.id,
        e.employee_id,
        e.first_name,
        e.last_name,
        e.position,
        e.role_id,
        d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.manager_id = $1 AND e.status IN ('Active', 'Pending Onboarding')
      ORDER BY e.first_name, e.last_name
    `;

    const result = await query(sqlQuery2, [currentId]);

    result.rows.forEach((row: any) => {
      chain.push({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        position: row.position,
        department: row.department_name,
        role: row.role_id,
        managerId: currentId
      });
      queue.push(row.id);
    });
  }

  return chain;
}

export default router;
