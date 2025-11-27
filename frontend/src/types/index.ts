export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: Address;
  department: string;
  departmentId: string;
  position: string;
  role: string;
  managerId?: string | null;
  hireDate: string;
  employmentType: string;
  salary: number;
  status: string;
  directReports?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    accountType: string;
  };
  skills?: string[];
  education?: Array<{
    degree: string;
    institution: string;
    year: number;
    grade?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
  }>;
}

export interface User {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  role: string;
  permissions: string[];
  status: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface OnboardingTask {
  id: string;
  employeeId: string;
  taskName: string;
  taskType: 'personal_info' | 'documents' | 'bank_details' | 'policies' | 'training';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  required: boolean;
  dueDate?: string;
  completedAt?: string;
  reviewedBy?: string;
  comments?: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours?: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half-day' | 'Regularized';
  regularizationReason?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Leave {
  id: string;
  employeeId: string;
  leaveType: 'Annual' | 'Sick' | 'Personal' | 'Maternity' | 'Paternity' | 'Emergency';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  conveyance: number;
  lta: number;
  medical: number;
  otherAllowances: number;
  totalEarnings: number;
  pf: number;
  professionalTax: number;
  incomeTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: 'Draft' | 'Processed' | 'Paid';
  processedBy?: string;
  processedAt?: string;
  paidAt?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headRole: string;
  budget: number;
  employeeCount: number;
  location: string;
  functions: string[];
  subDepartments?: Array<{
    id: string;
    name: string;
    headRole: string;
    employeeCount: number;
  }>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
