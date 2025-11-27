import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, User, Employee } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle common errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.api.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.api.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.api.put(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.api.patch(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.api.delete(url);
    return response.data;
  }

  // Auth specific methods
  async login(credentials: { email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.post('/auth/login', credentials);
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get('/auth/me');
  }

  async changePassword(data: { oldPassword: string; newPassword: string }) {
    return this.post('/auth/change-password', data);
  }

  // Employee methods
  async getEmployees(params?: any) {
    return this.get('/employees', params);
  }

  async getEmployee(id: string) {
    return this.get(`/employees/${id}`);
  }

  async updateEmployee(id: string, data: any) {
    return this.put(`/employees/${id}`, data);
  }

  async getEmployeeProfile() {
    return this.get('/employees/profile');
  }

  async updateEmployeeProfile(data: any) {
    return this.put('/employees/profile', data);
  }

  // Add createEmployee method here (after updateEmployee)
  async createEmployee(data: any) {
    return this.post('/employees', data);
  }

  async getManagersByDepartment(departmentId: string) {
    return this.get(`/employees/managers/${departmentId}`);
  }

  // Department methods
  async getDepartments() {
    return this.get('/departments');
  }

  async getDepartment(id: string) {
    return this.get(`/departments/${id}`);
  }

  // Onboarding methods
  async getOnboardingTasks(employeeId: string) {
    return this.get(`/onboarding/${employeeId}/tasks`);
  }

  async updateOnboardingTask(employeeId: string, taskId: string, data: any) {
    return this.put(`/onboarding/${employeeId}/tasks/${taskId}`, data);
  }

  async completeOnboarding(employeeId: string) {
    return this.post(`/onboarding/${employeeId}/complete`);
  }

  // Attendance methods
  async getAttendance(employeeId?: string, params?: any) {
    const url = employeeId ? `/attendance/${employeeId}` : '/attendance';
    return this.get(url, params);
  }

  async clockIn(data: any) {
    return this.post('/attendance/clock-in', data);
  }

  async clockOut(data: any) {
    return this.post('/attendance/clock-out', data);
  }

  async submitRegularization(employeeId: string, data: any) {
    return this.post(`/attendance/${employeeId}/regularization`, data);
  }

  // Leave methods
  async getLeaves(employeeId?: string) {
    const url = employeeId ? `/leaves/${employeeId}` : '/leaves';
    return this.get(url);
  }

  async applyLeave(data: any) {
    return this.post('/leaves', data);
  }

  async updateLeaveStatus(leaveId: string, data: any) {
    return this.put(`/leaves/${leaveId}/status`, data);
  }

  // Payroll methods
  async getPayroll(employeeId?: string, params?: any) {
    const url = employeeId ? `/payroll/${employeeId}` : '/payroll';
    return this.get(url, params);
  }

  async generatePayslip(employeeId: string, month: number, year: number) {
    return this.post(`/payroll/${employeeId}/generate`, { month, year });
  }

  async processPayroll(data: any) {
    return this.post('/payroll/process', data);
  }

  // Organization structure methods
  async getOrgStructure() {
    return this.get('/organization/structure');
  }

  async getReportingChain(employeeId: string) {
    return this.get(`/organization/${employeeId}/reporting-chain`);
  }

  async searchEmployees(params: { q?: string; department?: string; role?: string; position?: string }) {
    return this.get('/organization/search', params);
  }

  async getDepartmentDetails(departmentId: string) {
    return this.get(`/organization/departments/${departmentId}`);
  }

  // Notifications
  async getNotifications() {
    return this.get('/notifications');
  }

  async markNotificationRead(notificationId: string) {
    return this.put(`/notifications/${notificationId}/read`);
  }

  async markAllNotificationsRead() {
    return this.put('/notifications/mark-all-read');
  }

  // File upload
  async uploadFile(file: File, type: string, employeeId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('employeeId', employeeId);

    const response = await this.api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
