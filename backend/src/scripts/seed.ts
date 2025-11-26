import { query } from '../config/database';
import employeesData from '../../../data/employee.json';
import rolesPermissionsData from '../../../data/roles-permission.json';
import departmentsData from '../../../data/department.json';
import organizationStructureData from '../../../data/organization-structure.json';
import { Employee, Role, Department } from '../types';
import { AuthService } from '../services/authService';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Seed roles and permissions first
    console.log('Seeding roles and permissions...');
    for (const role of rolesPermissionsData.roles as Role[]) {
      await query(
        `INSERT INTO roles (id, name, description, level, permissions, inherits_from)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           level = EXCLUDED.level,
           permissions = EXCLUDED.permissions,
           inherits_from = EXCLUDED.inherits_from`,
        [role.id, role.name, role.description, role.level, JSON.stringify(role.permissions), JSON.stringify(role.inheritsFrom)]
      );
    }

    // Seed departments
    console.log('Seeding departments...');
    for (const dept of departmentsData as Department[]) {
      await query(
        `INSERT INTO departments (id, name, description, head_role, budget, employee_count, location, functions, sub_departments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           head_role = EXCLUDED.head_role,
           budget = EXCLUDED.budget,
           employee_count = EXCLUDED.employee_count,
           location = EXCLUDED.location,
           functions = EXCLUDED.functions,
           sub_departments = EXCLUDED.sub_departments`,
        [dept.id, dept.name, dept.description, dept.headRole, dept.budget, dept.employeeCount, dept.location, JSON.stringify(dept.functions), JSON.stringify(dept.subDepartments || [])]
      );
    }

    // Seed employees
    console.log('Seeding employees...');
    for (const emp of (employeesData as any[])) {
      await query(
        `INSERT INTO employees (id, employee_id, first_name, last_name, email, phone, date_of_birth, gender, address, department_id, position, role_id, manager_id, hire_date, employment_type, salary, status, direct_reports, skills, education, certifications)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
         ON CONFLICT (id) DO UPDATE SET
           employee_id = EXCLUDED.employee_id,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           date_of_birth = EXCLUDED.date_of_birth,
           gender = EXCLUDED.gender,
           address = EXCLUDED.address,
           department_id = EXCLUDED.department_id,
           position = EXCLUDED.position,
           role_id = EXCLUDED.role_id,
           manager_id = EXCLUDED.manager_id,
           hire_date = EXCLUDED.hire_date,
           employment_type = EXCLUDED.employment_type,
           salary = EXCLUDED.salary,
           status = EXCLUDED.status,
           direct_reports = EXCLUDED.direct_reports,
           skills = COALESCE(EXCLUDED.skills, '[]'::jsonb),
           education = COALESCE(EXCLUDED.education, '[]'::jsonb),
           certifications = COALESCE(EXCLUDED.certifications, '[]'::jsonb)`,
        [
          emp.id,
          emp.employeeId,
          emp.firstName,
          emp.lastName,
          emp.email,
          emp.phone,
          emp.dateOfBirth,
          emp.gender,
          JSON.stringify(emp.address),
          emp.department,
          emp.position,
          emp.role,
          emp.managerId || null,
          emp.hireDate,
          emp.employmentType,
          emp.salary,
          emp.status,
          JSON.stringify(emp.directReports || []),
          JSON.stringify(emp.skills || []),
          JSON.stringify(emp.education || []),
          JSON.stringify(emp.certifications || [])
        ]
      );
    }

    // Create user accounts for employees with default passwords
    console.log('Creating user accounts...');
    const defaultPassword = 'Welcome@123'; // Temporary password

    for (const emp of (employeesData as any[])) {
      try {
        await AuthService.createUser(emp.id, emp.email, defaultPassword, emp.role);
        console.log(`Created user account for ${emp.firstName} ${emp.lastName}`);
      } catch (error) {
        // User might already exist, skip
        console.log(`User account already exists for ${emp.firstName} ${emp.lastName}`);
      }
    }

    // Create some sample onboarding tasks for employees with status "Pending Onboarding"
    console.log('Creating sample onboarding tasks...');
    const pendingEmployees = (employeesData as any[]).filter((emp: any) => emp.status === 'Pending Onboarding');

    for (const emp of pendingEmployees) {
      const onboardingTasks = [
        {
          task_name: 'Complete Personal Information',
          task_type: 'personal_info',
          status: 'pending',
          required: true
        },
        {
          task_name: 'Upload ID Proof',
          task_type: 'documents',
          status: 'pending',
          required: true
        },
        {
          task_name: 'Upload Resume',
          task_type: 'documents',
          status: 'pending',
          required: true
        },
        {
          task_name: 'Submit Bank Details',
          task_type: 'bank_details',
          status: 'pending',
          required: true
        },
        {
          task_name: 'Review Company Policies',
          task_type: 'policies',
          status: 'pending',
          required: true
        }
      ];

      for (const task of onboardingTasks) {
        await query(
          `INSERT INTO onboarding_tasks (employee_id, task_name, task_type, status, required)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [emp.id, task.task_name, task.task_type, task.status, task.required]
        );
      }
    }

    console.log('Database seeding completed successfully!');
    console.log(`\nDefault login credentials:`);
    console.log(`Email: sarah.johnson@techcorp.com (CEO)`);
    console.log(`Password: ${defaultPassword}`);
    console.log(`\nFor other employees, use their email with the same password.`);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;
