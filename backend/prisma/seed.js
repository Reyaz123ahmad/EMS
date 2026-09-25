import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Database Seed...');

  // ==========================================
  // 1. SUBSCRIPTION PLANS
  // ==========================================
  console.log('📦 Seeding Subscription Plans...');

  const plans = [
    {
      name: 'Basic',
      description: 'Starter plan for small businesses with basic attendance and employee records.',
      price: 499.0,
      billingCycle: 'monthly',
      features: {
        attendance: {
          face: true,
          card: false,
          finger: false,
          geoFencing: false,
          multiLayer: false
        },
        employees: true,
        leave: true,
        payroll: false,
        overtime: false,
        reports: true,
        documents: true,
        onboarding: true
      },
      maxEmployees: 50,
      maxBranches: 1,
      maxDevices: 1,
      maxStorageGB: 5,
      securityLevel: 'basic',
      isActive: true
    },
    {
      name: 'Pro',
      description: 'Advanced plan for growing companies needing geofencing, payroll, and asset management.',
      price: 999.0,
      billingCycle: 'monthly',
      features: {
        attendance: {
          face: true,
          card: true,
          finger: false,
          geoFencing: true,
          multiLayer: false
        },
        employees: true,
        leave: true,
        payroll: true,
        overtime: true,
        reports: true,
        documents: true,
        onboarding: true,
        assets: true,
        certificates: true,
        shifts: true,
        rosters: true
      },
      maxEmployees: 500,
      maxBranches: 5,
      maxDevices: 10,
      maxStorageGB: 50,
      securityLevel: 'standard',
      isActive: true
    },
    {
      name: 'Enterprise',
      description: 'Full-featured enterprise plan with all biometric options, API access, SSO, and unlimited scale.',
      price: 2999.0,
      billingCycle: 'monthly',
      features: {
        attendance: {
          face: true,
          card: true,
          finger: true,
          geoFencing: true,
          multiLayer: true
        },
        employees: true,
        leave: true,
        payroll: true,
        overtime: true,
        performance: true,
        projects: true,
        clientPortal: true,
        reports: true,
        assets: true,
        certificates: true,
        shifts: true,
        rosters: true,
        documents: true,
        onboarding: true,
        api_access: true,
        sso: true,
        audit_logs: true
      },
      maxEmployees: -1,
      maxBranches: -1,
      maxDevices: -1,
      maxStorageGB: 500,
      securityLevel: 'high',
      isActive: true
    }
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan
    });
  }
  console.log('✅ Subscription Plans seeded successfully.');

  // ==========================================
  // 2. ROLES (7 System Roles)
  // ==========================================
  console.log('👥 Seeding System Roles...');

  const roles = [
    {
      name: 'SUPER_ADMIN',
      displayName: 'Super Administrator',
      description: 'Full platform administrative access across all tenants and system configurations.',
      isSystem: true
    },
    {
      name: 'COMPANY_ADMIN',
      displayName: 'Company Administrator',
      description: 'Complete administrative access within the company domain.',
      isSystem: true
    },
    {
      name: 'HR_ADMIN',
      displayName: 'HR Administrator',
      description: 'Management of employees, leaves, payroll, attendance, and HR operations.',
      isSystem: true
    },
    {
      name: 'HR_MANAGER',
      displayName: 'HR Manager',
      description: 'Operational HR management including attendance approval, employee creation, and leave approval.',
      isSystem: true
    },
    {
      name: 'MANAGER',
      displayName: 'Department Manager',
      description: 'Team supervisor with oversight of direct subordinates and team approvals.',
      isSystem: true
    },
    {
      name: 'EMPLOYEE',
      displayName: 'Employee',
      description: 'Standard employee portal access for self-service attendance, leaves, and documents.',
      isSystem: true
    },
    {
      name: 'CLIENT',
      displayName: 'Client Portal User',
      description: 'External client with access to project progress and requirements.',
      isSystem: true
    }
  ];

  const createdRoles = {};
  for (const role of roles) {
    let r = await prisma.role.findFirst({
      where: {
        companyId: null,
        name: role.name
      }
    });

    if (r) {
      r = await prisma.role.update({
        where: { id: r.id },
        data: role
      });
    } else {
      r = await prisma.role.create({
        data: {
          ...role,
          companyId: null
        }
      });
    }
    createdRoles[role.name] = r;
  }
  console.log('✅ System Roles seeded successfully.');

  // ==========================================
  // 3. PERMISSIONS
  // ==========================================
  console.log('🔑 Seeding Permissions...');

  const permissionList = [
    // Platform
    { key: 'platform.view', category: 'platform', description: 'View platform metrics and all companies' },
    { key: 'platform.manage_companies', category: 'platform', description: 'Create, update, suspend companies' },
    { key: 'platform.manage_plans', category: 'platform', description: 'Manage subscription plans and billing' },
    { key: 'platform.system_settings', category: 'platform', description: 'Configure global system parameters' },

    // Attendance
    { key: 'attendance.view_self', category: 'attendance', description: 'View personal attendance history' },
    { key: 'attendance.mark_self', category: 'attendance', description: 'Mark self check-in and check-out' },
    { key: 'attendance.view_all', category: 'attendance', description: 'View company-wide attendance logs' },
    { key: 'attendance.approve', category: 'attendance', description: 'Approve emergency attendance & adjustments' },
    { key: 'attendance.manage_rules', category: 'attendance', description: 'Configure shifts, rosters, and rules' },

    // Employees
    { key: 'employees.view_self', category: 'employees', description: 'View own profile and employment data' },
    { key: 'employees.view_all', category: 'employees', description: 'View directory of all company employees' },
    { key: 'employees.create', category: 'employees', description: 'Onboard and create new employee records' },
    { key: 'employees.edit', category: 'employees', description: 'Update employee details and structures' },
    { key: 'employees.delete', category: 'employees', description: 'Terminate or delete employee profiles' },

    // Leave
    { key: 'leave.view_self', category: 'leave', description: 'View own leave balances and history' },
    { key: 'leave.apply', category: 'leave', description: 'Apply for leave requests' },
    { key: 'leave.view_all', category: 'leave', description: 'View all company leave applications' },
    { key: 'leave.approve', category: 'leave', description: 'Approve or reject leave applications' },
    { key: 'leave.manage_types', category: 'leave', description: 'Create and configure leave types and quotas' },

    // Payroll
    { key: 'payroll.view_self', category: 'payroll', description: 'View and download own payslips' },
    { key: 'payroll.view_all', category: 'payroll', description: 'View company payroll sheets and structures' },
    { key: 'payroll.process', category: 'payroll', description: 'Execute and finalize payroll runs' },
    { key: 'payroll.manage_components', category: 'payroll', description: 'Configure salary heads and deductions' },

    // Documents
    { key: 'documents.view_self', category: 'documents', description: 'View own documents and certificates' },
    { key: 'documents.upload', category: 'documents', description: 'Upload personal compliance documents' },
    { key: 'documents.view_all', category: 'documents', description: 'View all employee documents repository' },
    { key: 'documents.verify', category: 'documents', description: 'Verify and approve compliance documents' },

    // Reports
    { key: 'reports.view', category: 'reports', description: 'View analytics, dashboards, and export reports' },

    // Settings
    { key: 'settings.view', category: 'settings', description: 'View company configurations' },
    { key: 'settings.manage', category: 'settings', description: 'Update company settings and preferences' },

    // Users
    { key: 'users.view', category: 'users', description: 'View system users list' },
    { key: 'users.manage', category: 'users', description: 'Manage user credentials and access locks' },

    // Roles
    { key: 'roles.view', category: 'roles', description: 'View roles and permissions' },
    { key: 'roles.manage', category: 'roles', description: 'Create and assign custom roles' }
  ];

  await prisma.permission.createMany({
    data: permissionList,
    skipDuplicates: true
  });

  const allDbPermissions = await prisma.permission.findMany();
  const createdPermissions = {};
  for (const p of allDbPermissions) {
    createdPermissions[p.key] = p;
  }
  console.log('✅ Permissions seeded successfully.');

  // ==========================================
  // 4. ROLE-PERMISSION MAPPINGS
  // ==========================================
  console.log('🔗 Assigning Permissions to Roles...');

  const rolePermissionMap = {
    SUPER_ADMIN: Object.keys(createdPermissions),
    COMPANY_ADMIN: Object.keys(createdPermissions).filter((k) => !k.startsWith('platform.')),
    HR_ADMIN: [
      'attendance.view_self',
      'attendance.mark_self',
      'attendance.view_all',
      'attendance.approve',
      'attendance.manage_rules',
      'employees.view_self',
      'employees.view_all',
      'employees.create',
      'employees.edit',
      'employees.delete',
      'leave.view_self',
      'leave.apply',
      'leave.view_all',
      'leave.approve',
      'leave.manage_types',
      'payroll.view_self',
      'payroll.view_all',
      'payroll.process',
      'payroll.manage_components',
      'documents.view_self',
      'documents.upload',
      'documents.view_all',
      'documents.verify',
      'reports.view',
      'settings.view',
      'users.view'
    ],
    HR_MANAGER: [
      'attendance.view_all',
      'attendance.approve',
      'employees.view_all',
      'employees.create',
      'employees.edit',
      'leave.view_all',
      'leave.approve',
      'documents.verify',
      'reports.view'
    ],
    MANAGER: [
      'attendance.view_self',
      'attendance.mark_self',
      'attendance.view_all',
      'attendance.approve',
      'employees.view_all',
      'leave.view_self',
      'leave.apply',
      'leave.view_all',
      'leave.approve',
      'reports.view'
    ],
    EMPLOYEE: [
      'attendance.view_self',
      'attendance.mark_self',
      'employees.view_self',
      'leave.view_self',
      'leave.apply',
      'payroll.view_self',
      'documents.view_self',
      'documents.upload'
    ],
    CLIENT: []
  };

  const rolePermissionData = [];
  for (const [roleName, permKeys] of Object.entries(rolePermissionMap)) {
    const role = createdRoles[roleName];
    if (!role) continue;

    for (const key of permKeys) {
      const perm = createdPermissions[key];
      if (perm) {
        rolePermissionData.push({
          roleId: role.id,
          permissionId: perm.id
        });
      }
    }
  }

  await prisma.rolePermission.createMany({
    data: rolePermissionData,
    skipDuplicates: true
  });
  console.log('✅ Role-Permission mappings assigned.');

  // ==========================================
  // 5. SUPER ADMIN USER
  // ==========================================
  console.log('👑 Seeding Super Admin User...');

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'reyazahmadmath@gmail.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Reyaz123@_Ahmad';
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(superAdminPassword, salt);

  const superAdminUser = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      passwordHash,
      status: 'ACTIVE'
    },
    create: {
      email: superAdminEmail,
      passwordHash,
      status: 'ACTIVE',
      twoFactorEnabled: false
    }
  });

  const superAdminRole = createdRoles['SUPER_ADMIN'];
  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: superAdminUser.id,
          roleId: superAdminRole.id
        }
      },
      update: {},
      create: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id
      }
    });
  }

  console.log(`✅ Super Admin created with email: ${superAdminEmail}`);
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
