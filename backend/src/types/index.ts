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

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  permissions: string[];
  inheritsFrom: string[];
}

export interface Permission {
  [key: string]: {
    [key: string]: string;
  };
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

export interface OrganizationStructure {
  organization: {
    name: string;
    type: string;
    headquarters: string;
    established: string;
    structure: {
      levels: string[];
    };
  };
  departments: Array<{
    id: string;
    name: string;
    head: string;
    subDepartments: string[];
    teams: string[];
  }>;
  hierarchy: {
    [key: string]: {
      directReports: string[];
      level: number;
    };
  };
  reportingChains: {
    [key: string]: string[];
  };
}

export interface User {
  id: string;
  employeeId: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  processedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingTask {
  id: string;
  employeeId: string;
  taskName: string;
  taskType: 'personal_info' | 'documents' | 'bank_details' | 'policies' | 'training';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  required: boolean;
  dueDate?: string;
  completedAt?: Date;
  reviewedBy?: string;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  employeeId: string;
  documentType: 'id_proof' | 'pan' | 'resume' | 'certificates' | 'bank_proof' | 'other';
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  status: 'uploaded' | 'pending_review' | 'approved' | 'rejected';
  uploadedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  comments?: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    employeeId: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
