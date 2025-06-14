/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { PermissionName } from '../enum';

// Business User Permissions
export const permissions = [
  // Organization Overview
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_DASHBOARD,
    description: 'View organization dashboard and key metrics',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_MANAGE_ORGANIZATION,
    description: 'Manage organization settings and configuration',
  },

  // Company Management
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_COMPANIES,
    description: 'View all companies and their details',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_MANAGE_COMPANIES,
    description: 'Create and manage companies',
  },

  // Branch Management
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_BRANCHES,
    description: 'View all branches and their performance',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_MANAGE_BRANCHES,
    description: 'Create and manage branches',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_RESTRICT_BRANCH_ACCESS,
    description: 'Restrict access to specific branches',
  },

  // Staff Management
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_STAFF,
    description: 'View staff directory and details',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_MANAGE_STAFF,
    description: 'Manage staff roles and assignments',
  },

  // Financial Management
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_FINANCES,
    description: 'View financial reports and analytics',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_MANAGE_FINANCES,
    description: 'Manage financial settings and approvals',
  },

  // Audit & Compliance
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_AUDIT,
    description: 'View audit logs and compliance reports',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_MANAGE_AUDIT,
    description: 'Manage audit settings and compliance',
  },

  // Payroll Management
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_PAYROLLS,
    description: 'View all payroll records and reports',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_MANAGE_PAYROLLS,
    description: 'Manage payroll settings and configurations',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_APPROVE_PAYROLLS,
    description: 'Approve payroll disbursements',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_PAYROLL_REPORTS,
    description: 'View payroll reports and analytics',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_MANAGE_PAYROLL_SCHEDULES,
    description: 'Manage payroll schedules and cycles',
  },

  // Fund Management
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_MONTHLY_BUDGETS,
    description: 'View monthly budget allocations and reports',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_MANAGE_MONTHLY_BUDGETS,
    description: 'Create and manage monthly budget allocations',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_APPROVE_MONTHLY_BUDGETS,
    description: 'Approve monthly budget allocations',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_BRANCH_ALLOCATIONS,
    description: 'View branch budget allocations',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_MANAGE_BRANCH_ALLOCATIONS,
    description: 'Manage branch budget allocations',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_APPROVE_BRANCH_ALLOCATIONS,
    description: 'Approve branch budget allocations',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_FUND_REQUESTS,
    description: 'View fund requests from branches',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_APPROVE_FUND_REQUESTS,
    description: 'Approve fund requests from branches',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_DISBURSEMENTS,
    description: 'View fund disbursements',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_APPROVE_DISBURSEMENTS,
    description: 'Approve fund disbursements',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_EXTRA_FUND_REQUESTS,
    description: 'View extra fund requests from branches',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_APPROVE_EXTRA_FUND_REQUESTS,
    description: 'Approve extra fund requests from branches',
  },

  // Calendar Management
  {
    permission_name: PermissionName.BUSINESS_USER_VIEW_CALENDAR_EVENTS,
    description: 'View calendar events across branches',
  },
  {
    permission_name: PermissionName.BUSINESS_USER_MANAGE_CALENDAR_EVENTS,
    description: 'Manage calendar events across branches',
  },

  // Dashboard & Profile
  {
    permission_name: PermissionName.STAFF_VIEW_DASHBOARD,
    description: 'View role-specific dashboard',
  },
  {
    permission_name: PermissionName.STAFF_VIEW_PROFILE,
    description: 'View own staff profile',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_PROFILE,
    description: 'Manage own staff profile',
  },

  // Schedule & Time
  {
    permission_name: PermissionName.STAFF_VIEW_SCHEDULE,
    description: 'View own schedule',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_SCHEDULE,
    description: 'Manage own schedule and availability',
  },

  // Branch Access
  {
    permission_name: PermissionName.STAFF_ACCESS_BRANCH,
    description: 'Access specific branch',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_BRANCH,
    description: 'Manage specific branch',
  },

  // Page Access
  {
    permission_name: PermissionName.STAFF_ACCESS_RECEPTION,
    description: 'Access reception pages',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_RECEPTION,
    description: 'Manage reception operations',
  },
  {
    permission_name: PermissionName.STAFF_ACCESS_KITCHEN,
    description: 'Access kitchen pages',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_KITCHEN,
    description: 'Manage kitchen operations',
  },
  {
    permission_name: PermissionName.STAFF_ACCESS_HOTEL,
    description: 'Access hotel management pages',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_HOTEL,
    description: 'Manage hotel operations',
  },
  {
    permission_name: PermissionName.STAFF_ACCESS_RESTAURANT,
    description: 'Access restaurant pages',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_RESTAURANT,
    description: 'Manage restaurant operations',
  },

  // Operations
  {
    permission_name: PermissionName.STAFF_VIEW_OPERATIONS,
    description: 'View role-specific operations',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_OPERATIONS,
    description: 'Manage role-specific operations',
  },

  // Tasks & Orders
  {
    permission_name: PermissionName.STAFF_VIEW_TASKS,
    description: 'View assigned tasks and orders',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_TASKS,
    description: 'Manage assigned tasks and orders',
  },

  // Communication
  {
    permission_name: PermissionName.STAFF_VIEW_COMMUNICATION,
    description: 'View communications',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_COMMUNICATION,
    description: 'Manage communications with clients and staff',
  },

  // Staff Payroll
  {
    permission_name: PermissionName.STAFF_VIEW_PAYROLL,
    description: 'View own payroll information',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_PAYROLL,
    description: 'Manage payroll for assigned staff',
  },
  {
    permission_name: PermissionName.STAFF_SEND_PAYROLL,
    description: 'Send payroll to staff members',
  },
  {
    permission_name: PermissionName.STAFF_VIEW_PAYROLL_REPORTS,
    description: 'View payroll reports for assigned staff',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_PAYROLL_SCHEDULES,
    description: 'Manage payroll schedules for assigned staff',
  },

  // Fund Management
  {
    permission_name: PermissionName.STAFF_VIEW_BRANCH_BUDGET,
    description: 'View branch budget allocation and details',
  },
  {
    permission_name: PermissionName.STAFF_REQUEST_FUNDS,
    description: 'Request funds from allocated budget',
  },
  {
    permission_name: PermissionName.STAFF_VIEW_FUND_REQUESTS,
    description: 'View fund request history and status',
  },
  {
    permission_name: PermissionName.STAFF_REQUEST_EXTRA_FUNDS,
    description: 'Request additional funds beyond allocation',
  },
  {
    permission_name: PermissionName.STAFF_VIEW_EXTRA_FUND_REQUESTS,
    description: 'View extra fund request history and status',
  },
  {
    permission_name: PermissionName.STAFF_VIEW_DISBURSEMENTS,
    description: 'View fund disbursement history and status',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_DISBURSEMENTS,
    description: 'Manage fund disbursements',
  },
  {
    permission_name: PermissionName.STAFF_APPROVE_DISBURSEMENTS,
    description: 'Approve fund disbursements',
  },
  {
    permission_name: PermissionName.STAFF_VIEW_ALLOCATIONS,
    description: 'View budget allocations',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_ALLOCATIONS,
    description: 'Manage budget allocations',
  },

  // Calendar Management
  {
    permission_name: PermissionName.STAFF_VIEW_CALENDAR_EVENTS,
    description: 'View calendar events for assigned branches',
  },
  {
    permission_name: PermissionName.STAFF_MANAGE_CALENDAR_EVENTS,
    description: 'Manage calendar events for assigned branches',
  },
];

// Permission Restrictions
export const permissionRestrictions = [
  {
    permission_name: PermissionName.RESTRICT_BRANCH_ACCESS,
    description: 'Restrict access to specific branches',
  },
  {
    permission_name: PermissionName.RESTRICT_PAGE_ACCESS,
    description: 'Restrict access to specific pages',
  },
  {
    permission_name: PermissionName.RESTRICT_GLOBAL_PERMISSIONS,
    description: 'Restrict global permissions in specific scenarios',
  },
  {
    permission_name: PermissionName.RESTRICT_PAYROLL_ACCESS,
    description: 'Restrict access to payroll information',
  },
  {
    permission_name: PermissionName.RESTRICT_PAYROLL_APPROVAL,
    description: 'Restrict payroll approval capabilities',
  },
  {
    permission_name: PermissionName.RESTRICT_PAYROLL_MANAGEMENT,
    description: 'Restrict payroll management capabilities',
  },
  {
    permission_name: PermissionName.RESTRICT_FUND_MANAGEMENT,
    description: 'Restrict fund management capabilities',
  },
  {
    permission_name: PermissionName.RESTRICT_FUND_APPROVAL,
    description: 'Restrict fund approval capabilities',
  },
  {
    permission_name: PermissionName.RESTRICT_DISBURSEMENT_ACCESS,
    description: 'Restrict access to disbursement information',
  },
  {
    permission_name: PermissionName.RESTRICT_DISBURSEMENT_APPROVAL,
    description: 'Restrict disbursement approval capabilities',
  },
];
