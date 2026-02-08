/**
 * Admin Module JavaScript
 * Handles all admin-related functionality
 */

// Global variables
let teachers = [];
let students = [];
let appointments = [];
let deleteTeacherId = null;

/**
 * Load admin dashboard data
 */
async function loadAdminDashboard() {
    try {
        Logger.info('Admin', 'Loading dashboard data', {});
        
        // Load statistics
        await loadStatistics();
        
        // Load recent activity
        loadRecentActivity();
        
        // Update admin name
        const user = getCurrentUser();
        if (user) {
            document.getElementById('adminName').textContent = user.name || 'Admin';
        }
        
    } catch (error) {
        Logger.error('Admin', 'Error loading dashboard', { error: error.message });
        showAlert('Error loading dashboard data', 'error');
    }
}

/**
 * Load statistics for dashboard
 */
async function loadStatistics() {
    try {
        // In a real implementation, these would be Firebase queries
        // For demo purposes, using localStorage or mock data
        
        // Load teachers count
        const teachersData = JSON.parse(localStorage.getItem('teachers') || '[]');
        document.getElementById('totalTeachers').textContent = teachersData.length;
        
        // Load students count
        const studentsData = JSON.parse(localStorage.getItem('students') || '[]');
        document.getElementById('totalStudents').textContent = studentsData.length;
        
        // Load pending approvals count
        const pendingCount = studentsData.filter(s => s.status === 'pending').length;
        document.getElementById('pendingApprovals').textContent = pendingCount;
        
        // Load appointments count
        const appointmentsData = JSON.parse(localStorage.getItem('appointments') || '[]');
        document.getElementById('totalAppointments').textContent = appointmentsData.length;
        
        Logger.info('Admin', 'Statistics loaded', {
            teachers: teachersData.length,
            students: studentsData.length,
            pending: pendingCount,
            appointments: appointmentsData.length
        });
        
    } catch (error) {
        Logger.error('Admin', 'Error loading statistics', { error: error.message });
    }
}

/**
 * Load recent activity
 */
function loadRecentActivity() {
    const logs = Logger.getLogs().slice(-10).reverse(); // Get last 10 logs
    const tbody = document.getElementById('activityTable');
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No recent activity</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td><span class="badge badge-${log.level.toLowerCase()}">${log.level}</span></td>
            <td>${log.module}</td>
            <td>${log.action}</td>
        </tr>
    `).join('');
}

/**
 * Refresh dashboard
 */
function refreshDashboard() {
    Logger.info('Admin', 'Dashboard refresh requested', {});
    loadAdminDashboard();
    showAlert('Dashboard refreshed successfully', 'success');
}

/**
 * Load teachers list
 */
async function loadTeachers() {
    try {
        Logger.info('Admin', 'Loading teachers', {});
        
        // Load from localStorage (in real app, this would be Firebase)
        teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
        
        renderTeachersTable();
        
    } catch (error) {
        Logger.error('Admin', 'Error loading teachers', { error: error.message });
        showAlert('Error loading teachers', 'error');
    }
}

/**
 * Render teachers table
 */
function renderTeachersTable(filteredTeachers = null) {
    const displayTeachers = filteredTeachers || teachers;
    const tbody = document.getElementById('teachersTable');
    
    if (displayTeachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No teachers found</td></tr>';
        return;
    }
    
    tbody.innerHTML = displayTeachers.map(teacher => `
        <tr>
            <td>${teacher.name}</td>
            <td>${teacher.email}</td>
            <td>${teacher.department}</td>
            <td>${teacher.subject}</td>
            <td>${teacher.phone || 'N/A'}</td>
            <td>
                <span class="badge badge-${teacher.status === 'active' ? 'success' : 'warning'}">
                    ${teacher.status || 'Active'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editTeacher('${teacher.id}')" style="padding: 0.5rem; margin-right: 0.5rem;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTeacher('${teacher.id}')" style="padding: 0.5rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Search teachers
 */
function searchTeachers() {
    const searchTerm = document.getElementById('searchTeacher').value.toLowerCase();
    const filtered = teachers.filter(teacher => 
        teacher.name.toLowerCase().includes(searchTerm) ||
        teacher.department.toLowerCase().includes(searchTerm) ||
        teacher.subject.toLowerCase().includes(searchTerm) ||
        teacher.email.toLowerCase().includes(searchTerm)
    );
    renderTeachersTable(filtered);
}

/**
 * Filter teachers by department
 */
function filterTeachers() {
    const department = document.getElementById('filterDepartment').value;
    const searchTerm = document.getElementById('searchTeacher').value.toLowerCase();
    
    let filtered = teachers;
    
    if (department) {
        filtered = filtered.filter(teacher => teacher.department === department);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(teacher => 
            teacher.name.toLowerCase().includes(searchTerm) ||
            teacher.department.toLowerCase().includes(searchTerm) ||
            teacher.subject.toLowerCase().includes(searchTerm) ||
            teacher.email.toLowerCase().includes(searchTerm)
        );
    }
    
    renderTeachersTable(filtered);
}

/**
 * Reset filters
 */
function resetFilters() {
    document.getElementById('searchTeacher').value = '';
    document.getElementById('filterDepartment').value = '';
    renderTeachersTable(teachers);
}

/**
 * Open add teacher modal
 */
function openAddTeacherModal() {
    document.getElementById('modalTitle').textContent = 'Add New Teacher';
    document.getElementById('teacherForm').reset();
    document.getElementById('teacherId').value = '';
    document.getElementById('teacherModal').style.display = 'block';
    
    Logger.info('Admin', 'Add teacher modal opened', {});
}

/**
 * Edit teacher
 */
function editTeacher(teacherId) {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Teacher';
    document.getElementById('teacherId').value = teacher.id;
    document.getElementById('teacherName').value = teacher.name;
    document.getElementById('teacherEmail').value = teacher.email;
    document.getElementById('teacherPhone').value = teacher.phone || '';
    document.getElementById('teacherDepartment').value = teacher.department;
    document.getElementById('teacherSubject').value = teacher.subject;
    document.getElementById('teacherQualification').value = teacher.qualification || '';
    document.getElementById('teacherOfficeHours').value = teacher.officeHours || '';
    document.getElementById('teacherBio').value = teacher.bio || '';
    
    document.getElementById('teacherModal').style.display = 'block';
    
    Logger.info('Admin', 'Edit teacher modal opened', { teacherId: teacherId });
}

/**
 * Close teacher modal
 */
function closeTeacherModal() {
    document.getElementById('teacherModal').style.display = 'none';
}

/**
 * Save teacher (add or update)
 */
async function saveTeacher(event) {
    event.preventDefault();
    
    const teacherId = document.getElementById('teacherId').value;
    const teacherData = {
        id: teacherId || generateId(),
        name: document.getElementById('teacherName').value,
        email: document.getElementById('teacherEmail').value,
        phone: document.getElementById('teacherPhone').value,
        department: document.getElementById('teacherDepartment').value,
        subject: document.getElementById('teacherSubject').value,
        qualification: document.getElementById('teacherQualification').value,
        officeHours: document.getElementById('teacherOfficeHours').value,
        bio: document.getElementById('teacherBio').value,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    try {
        if (teacherId) {
            // Update existing teacher
            const index = teachers.findIndex(t => t.id === teacherId);
            if (index !== -1) {
                teachers[index] = { ...teachers[index], ...teacherData, updatedAt: new Date().toISOString() };
            }
            Logger.logAdmin('update_teacher', getCurrentUser()?.id, { teacherId: teacherId });
            showAlert('Teacher updated successfully', 'success');
        } else {
            // Add new teacher
            teachers.push(teacherData);
            Logger.logAdmin('add_teacher', getCurrentUser()?.id, { teacherId: teacherData.id });
            showAlert('Teacher added successfully', 'success');
        }
        
        // Save to localStorage
        localStorage.setItem('teachers', JSON.stringify(teachers));
        
        closeTeacherModal();
        loadTeachers();
        
    } catch (error) {
        Logger.error('Admin', 'Error saving teacher', { error: error.message });
        showAlert('Error saving teacher', 'error');
    }
}

/**
 * Delete teacher
 */
function deleteTeacher(teacherId) {
    deleteTeacherId = teacherId;
    document.getElementById('deleteModal').style.display = 'block';
    
    Logger.info('Admin', 'Delete teacher confirmation opened', { teacherId: teacherId });
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteTeacherId = null;
}

/**
 * Confirm delete teacher
 */
async function confirmDelete() {
    if (!deleteTeacherId) return;
    
    try {
        teachers = teachers.filter(t => t.id !== deleteTeacherId);
        localStorage.setItem('teachers', JSON.stringify(teachers));
        
        Logger.logAdmin('delete_teacher', getCurrentUser()?.id, { teacherId: deleteTeacherId });
        showAlert('Teacher deleted successfully', 'success');
        
        closeDeleteModal();
        loadTeachers();
        
    } catch (error) {
        Logger.error('Admin', 'Error deleting teacher', { error: error.message });
        showAlert('Error deleting teacher', 'error');
    }
}

/**
 * Load students for approval
 */
async function loadStudents() {
    try {
        Logger.info('Admin', 'Loading students', { filter: currentFilter });
        
        // Load from localStorage (in real app, this would be Firebase)
        students = JSON.parse(localStorage.getItem('students') || '[]');
        
        // Filter students based on current filter
        let filteredStudents = students;
        if (currentFilter !== 'all') {
            filteredStudents = students.filter(s => s.status === currentFilter);
        }
        
        renderStudentsTable(filteredStudents);
        
        // Update pending count
        const pendingCount = students.filter(s => s.status === 'pending').length;
        document.getElementById('pendingCount').textContent = pendingCount;
        
    } catch (error) {
        Logger.error('Admin', 'Error loading students', { error: error.message });
        showAlert('Error loading students', 'error');
    }
}

/**
 * Render students table
 */
function renderStudentsTable(displayStudents) {
    const tbody = document.getElementById('studentsTable');
    const noStudentsDiv = document.getElementById('noStudents');
    
    if (displayStudents.length === 0) {
        tbody.innerHTML = '';
        noStudentsDiv.style.display = 'block';
        return;
    }
    
    noStudentsDiv.style.display = 'none';
    tbody.innerHTML = displayStudents.map(student => `
        <tr>
            <td>${student.studentId}</td>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>${student.department}</td>
            <td>${formatDate(student.registrationDate)}</td>
            <td>
                <span class="badge badge-${student.status === 'approved' ? 'success' : student.status === 'rejected' ? 'danger' : 'warning'}">
                    ${student.status.toUpperCase()}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openStudentModal('${student.id}')" style="padding: 0.5rem; margin-right: 0.5rem;">
                    <i class="fas fa-eye"></i>
                </button>
                ${student.status === 'pending' ? `
                    <button class="btn btn-sm btn-success" onclick="quickApprove('${student.id}')" style="padding: 0.5rem; margin-right: 0.5rem;">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="quickReject('${student.id}')" style="padding: 0.5rem;">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

/**
 * Get student by ID
 */
function getStudentById(studentId) {
    return students.find(s => s.id === studentId);
}

/**
 * Quick approve student
 */
async function quickApprove(studentId) {
    try {
        const index = students.findIndex(s => s.id === studentId);
        if (index !== -1) {
            students[index].status = 'approved';
            students[index].approvedAt = new Date().toISOString();
            students[index].approvedBy = getCurrentUser()?.id;
            
            localStorage.setItem('students', JSON.stringify(students));
            
            Logger.logAdmin('approve_student', getCurrentUser()?.id, { studentId: studentId });
            showAlert('Student approved successfully', 'success');
            
            loadStudents();
        }
    } catch (error) {
        Logger.error('Admin', 'Error approving student', { error: error.message });
        showAlert('Error approving student', 'error');
    }
}

/**
 * Quick reject student
 */
async function quickReject(studentId) {
    try {
        const index = students.findIndex(s => s.id === studentId);
        if (index !== -1) {
            students[index].status = 'rejected';
            students[index].rejectedAt = new Date().toISOString();
            students[index].rejectedBy = getCurrentUser()?.id;
            
            localStorage.setItem('students', JSON.stringify(students));
            
            Logger.logAdmin('reject_student', getCurrentUser()?.id, { studentId: studentId });
            showAlert('Student rejected', 'warning');
            
            loadStudents();
        }
    } catch (error) {
        Logger.error('Admin', 'Error rejecting student', { error: error.message });
        showAlert('Error rejecting student', 'error');
    }
}

/**
 * Approve student from modal
 */
async function approveStudent() {
    if (!selectedStudentId) return;
    await quickApprove(selectedStudentId);
    closeStudentModal();
}

/**
 * Reject student from modal
 */
async function rejectStudent() {
    if (!selectedStudentId) return;
    await quickReject(selectedStudentId);
    closeStudentModal();
}

/**
 * Approve all pending students
 */
async function approveAll() {
    try {
        const pendingStudents = students.filter(s => s.status === 'pending');
        
        if (pendingStudents.length === 0) {
            showAlert('No pending students to approve', 'warning');
            return;
        }
        
        if (!confirm(`Are you sure you want to approve all ${pendingStudents.length} pending students?`)) {
            return;
        }
        
        students = students.map(s => {
            if (s.status === 'pending') {
                return {
                    ...s,
                    status: 'approved',
                    approvedAt: new Date().toISOString(),
                    approvedBy: getCurrentUser()?.id
                };
            }
            return s;
        });
        
        localStorage.setItem('students', JSON.stringify(students));
        
        Logger.logAdmin('approve_all_students', getCurrentUser()?.id, { count: pendingStudents.length });
        showAlert(`Approved ${pendingStudents.length} students successfully`, 'success');
        
        loadStudents();
        
    } catch (error) {
        Logger.error('Admin', 'Error approving all students', { error: error.message });
        showAlert('Error approving students', 'error');
    }
}

/**
 * Refresh students list
 */
function refreshStudents() {
    Logger.info('Admin', 'Students list refresh requested', {});
    loadStudents();
    showAlert('Students list refreshed', 'success');
}

/**
 * Export logs
 */
function exportLogs() {
    Logger.exportLogs();
    showAlert('Logs exported successfully', 'success');
}

// Close modals when clicking outside
window.onclick = function(event) {
    const teacherModal = document.getElementById('teacherModal');
    const deleteModal = document.getElementById('deleteModal');
    const studentModal = document.getElementById('studentModal');
    
    if (event.target === teacherModal) {
        closeTeacherModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
    if (event.target === studentModal) {
        closeStudentModal();
    }
}
