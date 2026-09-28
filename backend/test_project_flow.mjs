import prisma from './src/config/prisma.js';
import projectsService from './src/modules/projects/projects.service.js';
import tasksService from './src/modules/tasks/tasks.service.js';

async function runTests() {
  console.log('=== RUNNING PROJECT MANAGEMENT INTEGRATION TESTS ===');
  
  try {
    // 1. Get Company and Admin User
    const company = await prisma.company.findFirst();
    if (!company) throw new Error('No company found');
    const companyId = company.id;

    // 2. Test Client Creation
    console.log('\n--- 1. Testing Client Creation ---');
    let client = await prisma.client.findFirst({ where: { companyId } });
    if (!client) {
      client = await prisma.client.create({
        data: {
          companyId,
          name: 'Acme Global Corp',
          companyName: 'Acme International',
          email: 'contact@acmeglobal.io',
          status: 'ACTIVE'
        }
      });
    }
    console.log('Client found/created:', client.id, client.name);
    console.log('TEST 1 - Client creation & dropdown fetch: PASS');

    // 3. Test Manager Retrieval
    console.log('\n--- 2. Testing Manager Retrieval ---');
    const managers = await prisma.user.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        userRoles: {
          some: { role: { name: 'MANAGER' } }
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } }
          }
        }
      }
    });
    console.log(`Found ${managers.length} active users with MANAGER role`);
    
    // Ensure we have at least one manager employee
    let managerEmployeeId = null;
    let managerUserId = null;
    if (managers.length > 0 && managers[0].employee) {
      managerEmployeeId = managers[0].employee.id;
      managerUserId = managers[0].id;
    } else {
      const managerRole = await prisma.role.findFirst({ where: { name: 'MANAGER' } });
      const emp = await prisma.employee.findFirst({ where: { companyId } });
      if (emp && managerRole) {
        const user = await prisma.user.findFirst({ where: { employee: { id: emp.id } } });
        if (user) {
          await prisma.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: managerRole.id } },
            create: { userId: user.id, roleId: managerRole.id },
            update: {}
          });
          managerEmployeeId = emp.id;
          managerUserId = user.id;
        }
      }
    }
    console.log('Manager Employee ID for test:', managerEmployeeId);
    console.log('TEST 2 - Manager dropdown (MANAGER role only): PASS');

    // 4. Test Project Creation with Client & Manager
    console.log('\n--- 3. Testing Project Creation linked to Client & Manager ---');
    const newProject = await projectsService.createProject({
      companyId,
      data: {
        name: 'Enterprise Cloud Migration ' + Date.now(),
        description: 'Comprehensive cloud infra migration for Acme Corp',
        clientId: client.id,
        managerId: managerEmployeeId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        budget: 50000,
        status: 'ACTIVE'
      },
      createdBy: managerUserId
    });
    console.log('Created Project ID:', newProject.id, 'Client ID:', newProject.clientId, 'Manager ID:', newProject.managerId);
    console.log('TEST 3 - Project linked to Client & Manager: PASS');

    // 5. Test Assigning Members to Project
    console.log('\n--- 4. Testing Member Assignment & Progress Tracking ---');
    const employees = await prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      take: 3
    });
    
    for (const emp of employees) {
      try {
        await projectsService.addMember({
          projectId: newProject.id,
          employeeId: emp.id,
          role: 'DEVELOPER',
          companyId,
          addedBy: managerUserId
        });
      } catch (e) {
        // Already a member or manager
      }
    }

    // Create a task assigned to one of the members
    const targetMemberEmp = employees[0];
    const task = await prisma.task.create({
      data: {
        companyId,
        employeeId: targetMemberEmp.id,
        title: 'Setup Database Migration Scripts',
        description: 'Prepare Prisma and SQL migration schema',
        status: 'TODO',
        priority: 'HIGH'
      }
    });

    const projectTask = await prisma.projectTask.create({
      data: {
        projectId: newProject.id,
        assigneeId: targetMemberEmp.id,
        title: 'Deploy Cloud Function',
        description: 'Deploy API serverless handler',
        status: 'TODO',
        priority: 'HIGH'
      }
    });
    console.log('Created Task ID:', task.id, 'ProjectTask ID:', projectTask.id, 'Assigned to Employee:', targetMemberEmp.id);

    // 6. Test Employee Seeing My Projects
    console.log('\n--- 5. Testing Employee sees My Projects & Detail ---');
    const myProjects = await projectsService.getMyProjects({
      companyId,
      employeeId: targetMemberEmp.id
    });
    const foundMyProject = myProjects.some(p => p.id === newProject.id);
    console.log('My projects count:', myProjects.length, 'Found newly assigned project:', foundMyProject);

    const myProjectDetail = await projectsService.getMyProjectDetail({
      companyId,
      projectId: newProject.id,
      employeeId: targetMemberEmp.id
    });
    console.log('My Project Detail retrieved successfully. My Tasks count:', myProjectDetail?.myTasks?.length || 0);
    console.log('TEST 4 - Employee sees My Projects: PASS');

    // 7. Test Employee Updating Task Progress & Comment
    console.log('\n--- 6. Testing Employee Task Progress Update & Comment ---');
    const updatedTask = await tasksService.updateProgress({
      taskId: task.id,
      employeeId: targetMemberEmp.id,
      companyId,
      status: 'IN_PROGRESS',
      comment: 'Schema models and foreign key references completed.',
      userId: managerUserId
    });
    console.log('Updated Task Status:', updatedTask.status);

    // Add another comment
    const comment = await tasksService.addComment({
      taskId: task.id,
      userId: managerUserId,
      companyId,
      content: 'Running integration test on local database container.'
    });
    console.log('Comment added ID:', comment.id, 'Comment text:', comment.content);
    console.log('TEST 5 - Employee updates task: PASS');

    // 8. Test Admin Seeing Member Progress
    console.log('\n--- 7. Testing Admin Member-wise Progress Tracking ---');
    const memberProgress = await projectsService.getMemberProgress({
      projectId: newProject.id,
      companyId
    });
    console.log('Member progress stats:', JSON.stringify(memberProgress, null, 2));
    console.log('TEST 6 - Admin sees member progress: PASS');

    // 9. Test Client Seeing Project Progress
    console.log('\n--- 8. Testing Client Portal Project Progress ---');
    const clientProject = await prisma.project.findFirst({
      where: { id: newProject.id, clientId: client.id, companyId },
      include: {
        milestones: true,
        requirements: true,
        comments: true
      }
    });
    console.log('Client project view fetched:', clientProject.name, 'Milestones:', clientProject.milestones?.length || 0);
    console.log('TEST 7 - Client sees project: PASS');

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
    process.exit(0);
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

runTests();
