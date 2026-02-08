/**
 * Student Module JavaScript
 * Handles all student-related functionality
 */

// Global variables
let studentBookings = [];
let studentMessages = [];
let availableTeachers = [];
let selectedTeacherId = null;
let selectedThreadId = null;

/**
 * Register new student
 */
async function registerStudent(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const studentId = document.getElementById('studentId').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const department = document.getElementById('department').value;
    const yearOfStudy = document.getElementById('yearOfStudy').value;
    const program = document.getElementById('program').value.trim();
    
    // Validation
    if (password !== confirmPassword) {
        showStatus('Passwords do not match!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showStatus('Password must be at least 6 characters long!', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showStatus('Please enter a valid email address!', 'error');
        return;
    }
    
    try {
        // Check if student ID already exists
        const existingStudents = JSON.parse(localStorage.getItem('students') || '[]');
        if (existingStudents.find(s => s.studentId === studentId)) {
            showStatus('Student ID already registered!', 'error');
            return;
        }
        
        if (existingStudents.find(s => s.email === email)) {
            showStatus('Email already registered!', 'error');
            return;
        }
        
        // Create student object
        const studentData = {
            id: generateId(),
            firstName: firstName,
            lastName: lastName,
            name: `${firstName} ${lastName}`,
            email: email,
            studentId: studentId,
            phone: phone,
            department: department,
            yearOfStudy: yearOfStudy,
            program: program,
            role: 'student',
            status: 'pending', // Pending admin approval
            registrationDate: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        // In real app, would use Firebase Auth to create user
        // For demo, store in localStorage
        existingStudents.push(studentData);
        localStorage.setItem('students', JSON.stringify(existingStudents));
        
        Logger.logStudent('register', studentData.id, {
            email: email,
            studentId: studentId,
            department: department
        });
        
        showStatus('Registration successful! Please wait for admin approval before logging in.', 'success');
        
        // Clear form
        document.getElementById('registrationForm').reset();
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
        
    } catch (error) {
        Logger.error('Student', 'Registration error', { error: error.message });
        showStatus('Registration failed. Please try again.', 'error');
    }
}

/**
 * Login student
 */
async function loginStudent(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    try {
        // In real app, would use Firebase Auth
        // For demo, check against localStorage
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const student = students.find(s => s.email === email);
        
        if (!student) {
            showStatus('Invalid email or password!', 'error');
            Logger.logAuth('login', null, false, { email: email, reason: 'user_not_found' });
            return;
        }
        
        // Check if approved
        if (student.status !== 'approved') {
            showStatus('Your account is pending admin approval. Please wait for approval.', 'warning');
            Logger.logAuth('login', student.id, false, { email: email, reason: 'not_approved' });
            return;
        }
        
        // In real app, would verify password with Firebase Auth
        // For demo, we'll just check if password is not empty
        if (password.length < 6) {
            showStatus('Invalid email or password!', 'error');
            Logger.logAuth('login', student.id, false, { email: email, reason: 'invalid_password' });
            return;
        }
        
        // Set current user
        setCurrentUser({
            id: student.id,
            email: student.email,
            name: student.name,
            role: 'student',
            studentId: student.studentId,
            department: student.department
        });
        
        Logger.logAuth('login', student.id, true, { email: email, role: 'student' });
        
        showStatus('Login successful! Redirecting...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        Logger.error('Student', 'Login error', { error: error.message });
        showStatus('Login failed. Please try again.', 'error');
    }
}

/**
 * Show status message
 */
function showStatus(message, type) {
    const statusDiv = document.getElementById('registrationStatus') || document.getElementById('loginStatus');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `alert alert-${type}`;
        statusDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }
}

/**
 * Forgot password
 */
function forgotPassword() {
    const email = prompt('Please enter your email address:');
    if (email && isValidEmail(email)) {
        Logger.info('Student', 'Password reset requested', { email: email });
        alert('If an account exists with this email, you will receive password reset instructions.');
    } else if (email) {
        alert('Please enter a valid email address.');
    }
}

/**
 * Load student dashboard
 */
async function loadStudentDashboard() {
    try {
        Logger.info('Student', 'Loading dashboard data', {});
        
        // Load statistics
        await loadStudentStats();
        
        // Load upcoming appointments
        loadStudentUpcoming();
        
        // Update student name
        const user = getCurrentUser();
        if (user) {
            document.getElementById('studentName').textContent = user.name || 'Student';
            document.getElementById('welcomeName').textContent = user.name?.split(' ')[0] || 'Student';
        }
        
    } catch (error) {
        Logger.error('Student', 'Error loading dashboard', { error: error.message });
        showAlert('Error loading dashboard data', 'error');
    }
}

/**
 * Load student statistics
 */
async function loadStudentStats() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        // Load bookings for this student
        const allBookings = JSON.parse(localStorage.getItem('appointments') || '[]');
        const studentBookings = allBookings.filter(b => b.studentId === user.id);
        
        // Upcoming appointments (this week)
        const today = new Date();
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const upcomingCount = studentBookings.filter(b => {
            const bookingDate = new Date(b.date);
            return bookingDate >= today && 
                   bookingDate <= weekEnd && 
                   (b.status === 'approved' || b.status === 'pending');
        }).length;
        
        document.getElementById('upcomingCount').textContent = upcomingCount;
        
        // Pending requests
        const pendingCount = studentBookings.filter(b => b.status === 'pending').length;
        document.getElementById('pendingCount').textContent = pendingCount;
        
        // Total bookings
        document.getElementById('totalBookings').textContent = studentBookings.length;
        
        // New messages
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        const unreadCount = messages.filter(m => m.studentId === user.id && !m.read && m.sender === 'teacher').length;
        document.getElementById('messageCount').textContent = unreadCount;
        
        Logger.info('Student', 'Statistics loaded', {
            upcoming: upcomingCount,
            pending: pendingCount,
            total: studentBookings.length,
            messages: unreadCount
        });
        
    } catch (error) {
        Logger.error('Student', 'Error loading statistics', { error: error.message });
    }
}

/**
 * Load student upcoming appointments
 */
function loadStudentUpcoming() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        const allBookings = JSON.parse(localStorage.getItem('appointments') || '[]');
        const studentBookings = allBookings.filter(b => 
            b.studentId === user.id && 
            (b.status === 'approved' || b.status === 'pending') &&
            new Date(b.date) >= new Date()
        ).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
        
        const tbody = document.getElementById('upcomingTable');
        
        if (studentBookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No upcoming appointments</td></tr>';
            return;
        }
        
        tbody.innerHTML = studentBookings.map(booking => `
            <tr>
                <td>${formatDate(booking.date)}</td>
                <td>${formatTime(booking.startTime)}</td>
                <td>${booking.teacherName}</td>
                <td>${booking.teacherSubject}</td>
                <td>
                    <span class="badge badge-${booking.status === 'approved' ? 'success' : 'warning'}">
                        ${booking.status.toUpperCase()}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewBookingDetails('${booking.id}')" style="padding: 0.5rem;">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        Logger.error('Student', 'Error loading upcoming appointments', { error: error.message });
    }
}

/**
 * View profile
 */
function viewProfile() {
    const user = getCurrentUser();
    if (!user) return;
    
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.id === user.id);
    
    if (student) {
        document.getElementById('profileContent').innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div><strong>Student ID:</strong> ${student.studentId}</div>
                <div><strong>Name:</strong> ${student.name}</div>
            </div>
            <div style="margin-bottom: 1rem;"><strong>Email:</strong> ${student.email}</div>
            <div style="margin-bottom: 1rem;"><strong>Phone:</strong> ${student.phone || 'Not provided'}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div><strong>Department:</strong> ${student.department}</div>
                <div><strong>Year:</strong> ${student.yearOfStudy}</div>
            </div>
            <div style="margin-bottom: 1rem;"><strong>Program:</strong> ${student.program}</div>
            <div style="margin-bottom: 1rem;">
                <strong>Status:</strong> 
                <span class="badge badge-${student.status === 'approved' ? 'success' : 'warning'}">
                    ${student.status.toUpperCase()}
                </span>
            </div>
            <div><strong>Registered:</strong> ${formatDate(student.registrationDate)}</div>
        `;
        
        document.getElementById('profileModal').style.display = 'block';
    }
}

/**
 * Close profile modal
 */
function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

/**
 * Edit profile
 */
function editProfile() {
    alert('Profile editing feature coming soon!');
    Logger.info('Student', 'Edit profile clicked', {});
}

/**
 * Load available teachers
 */
async function loadAvailableTeachers() {
    try {
        Logger.info('Student', 'Loading available teachers', {});
        
        // Load teachers from localStorage
        const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
        availableTeachers = teachers.filter(t => t.status === 'active');
        
        renderTeachersGrid();
        
    } catch (error) {
        Logger.error('Student', 'Error loading teachers', { error: error.message });
        showAlert('Error loading teachers', 'error');
    }
}

/**
 * Render teachers grid
 */
function renderTeachersGrid(filteredTeachers = null) {
    const displayTeachers = filteredTeachers || availableTeachers;
    const grid = document.getElementById('teachersGrid');
    
    document.getElementById('resultsCount').textContent = displayTeachers.length;
    
    if (displayTeachers.length === 0) {
        grid.innerHTML = `
            <div class="card" style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
                <i class="fas fa-search fa-3x" style="color: var(--gray-300); margin-bottom: 1rem;"></i>
                <p>No teachers found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = displayTeachers.map(teacher => `
        <div class="card" style="transition: transform 0.3s ease;">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 600;">
                    ${teacher.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 style="margin: 0; color: var(--dark-color);">${teacher.name}</h3>
                    <p style="margin: 0; color: var(--gray-600); font-size: 0.875rem;">${teacher.department}</p>
                </div>
            </div>
            <div style="margin-bottom: 1rem;">
                <p style="margin: 0.25rem 0; font-size: 0.875rem;"><strong>Subject:</strong> ${teacher.subject}</p>
                <p style="margin: 0.25rem 0; font-size: 0.875rem;"><strong>Qualification:</strong> ${teacher.qualification || 'N/A'}</p>
                <p style="margin: 0.25rem 0; font-size: 0.875rem;"><strong>Office Hours:</strong> ${teacher.officeHours || 'Not specified'}</p>
            </div>
            ${teacher.bio ? `<p style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 1rem;">${teacher.bio.substring(0, 100)}${teacher.bio.length > 100 ? '...' : ''}</p>` : ''}
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-primary" onclick="viewTeacherDetails('${teacher.id}')" style="flex: 1;">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-success" onclick="quickBook('${teacher.id}')" style="flex: 1;">
                    <i class="fas fa-calendar-plus"></i> Book
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Search teachers
 */
function searchTeachers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const deptFilter = document.getElementById('deptFilter').value;
    
    filterAndRenderTeachers(searchTerm, deptFilter);
}

/**
 * Filter teachers by department
 */
function filterTeachers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const deptFilter = document.getElementById('deptFilter').value;
    
    filterAndRenderTeachers(searchTerm, deptFilter);
}

/**
 * Filter and render teachers
 */
function filterAndRenderTeachers(searchTerm, deptFilter) {
    let filtered = availableTeachers;
    
    if (searchTerm) {
        filtered = filtered.filter(teacher => 
            teacher.name.toLowerCase().includes(searchTerm) ||
            teacher.subject.toLowerCase().includes(searchTerm) ||
            teacher.department.toLowerCase().includes(searchTerm)
        );
    }
    
    if (deptFilter) {
        filtered = filtered.filter(teacher => teacher.department === deptFilter);
    }
    
    renderTeachersGrid(filtered);
}

/**
 * Reset search
 */
function resetSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('deptFilter').value = '';
    renderTeachersGrid();
}

/**
 * Refresh teachers
 */
function refreshTeachers() {
    Logger.info('Student', 'Teachers refresh requested', {});
    loadAvailableTeachers();
    showAlert('Teachers list refreshed', 'success');
}

/**
 * View teacher details
 */
function viewTeacherDetails(teacherId) {
    selectedTeacherId = teacherId;
    const teacher = availableTeachers.find(t => t.id === teacherId);
    
    if (teacher) {
        document.getElementById('teacherDetails').innerHTML = `
            <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 600;">
                    ${teacher.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 style="margin: 0; color: var(--dark-color);">${teacher.name}</h2>
                    <p style="margin: 0.25rem 0; color: var(--gray-600);">${teacher.department}</p>
                    <span class="badge badge-success">Active</span>
                </div>
            </div>
            <div style="margin-bottom: 1rem;">
                <p><strong>Email:</strong> ${teacher.email}</p>
                <p><strong>Phone:</strong> ${teacher.phone || 'Not provided'}</p>
                <p><strong>Subject:</strong> ${teacher.subject}</p>
                <p><strong>Qualification:</strong> ${teacher.qualification || 'Not specified'}</p>
                <p><strong>Office Hours:</strong> ${teacher.officeHours || 'Not specified'}</p>
            </div>
            ${teacher.bio ? `
                <div style="background: var(--gray-100); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
                    <strong>About:</strong>
                    <p style="margin: 0.5rem 0 0 0; color: var(--gray-600);">${teacher.bio}</p>
                </div>
            ` : ''}
        `;
        
        document.getElementById('teacherModal').style.display = 'block';
    }
}

/**
 * Close teacher modal
 */
function closeTeacherModal() {
    document.getElementById('teacherModal').style.display = 'none';
}

/**
 * Quick book with teacher
 */
function quickBook(teacherId) {
    selectedTeacherId = teacherId;
    openBookingModal();
}

/**
 * Book with selected teacher
 */
function bookWithTeacher() {
    openBookingModal();
}

/**
 * Open booking modal
 */
function openBookingModal() {
    const teacher = availableTeachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return;
    
    // Load available slots for this teacher
    const allSlots = JSON.parse(localStorage.getItem('slots') || '[]');
    const availableSlots = allSlots.filter(s => 
        s.teacherId === teacher.id && 
        s.status === 'available' &&
        new Date(s.date) >= new Date()
    ).sort((a, b) => new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime));
    
    const slotSelect = document.getElementById('bookingSlot');
    slotSelect.innerHTML = '<option value="">Choose a time slot...</option>';
    
    if (availableSlots.length === 0) {
        slotSelect.innerHTML += '<option value="" disabled>No available slots</option>';
    } else {
        availableSlots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.id;
            option.textContent = `${formatDate(slot.date)} - ${formatTime(slot.startTime)} to ${formatTime(slot.endTime)}`;
            slotSelect.appendChild(option);
        });
    }
    
    document.getElementById('bookingTeacherId').value = teacher.id;
    document.getElementById('bookingTeacherName').value = teacher.name;
    document.getElementById('bookingForm').reset();
    document.getElementById('bookingModal').style.display = 'block';
    
    Logger.info('Student', 'Booking modal opened', { teacherId: teacher.id });
}

/**
 * Close booking modal
 */
function closeBookingModal() {
    document.getElementById('bookingModal').style.display = 'none';
}

/**
 * Update slot selection
 */
function updateSlotSelection() {
    const slotId = document.getElementById('bookingSlot').value;
    document.getElementById('bookingSlotId').value = slotId;
}

/**
 * Submit booking
 */
async function submitBooking(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) return;
    
    const teacherId = document.getElementById('bookingTeacherId').value;
    const slotId = document.getElementById('bookingSlot').value;
    const purpose = document.getElementById('bookingPurpose').value;
    const message = document.getElementById('bookingMessage').value;
    
    if (!slotId) {
        showAlert('Please select a time slot', 'error');
        return;
    }
    
    try {
        // Get slot details
        const allSlots = JSON.parse(localStorage.getItem('slots') || '[]');
        const slot = allSlots.find(s => s.id === slotId);
        
        if (!slot) {
            showAlert('Selected slot not found', 'error');
            return;
        }
        
        // Get teacher details
        const teacher = availableTeachers.find(t => t.id === teacherId);
        
        // Create booking
        const booking = {
            id: generateId(),
            studentId: user.id,
            studentName: user.name,
            studentEmail: user.email,
            teacherId: teacherId,
            teacherName: teacher.name,
            teacherDepartment: teacher.department,
            teacherSubject: teacher.subject,
            slotId: slotId,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            location: slot.location,
            purpose: purpose,
            message: message,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        // Save booking
        const allBookings = JSON.parse(localStorage.getItem('appointments') || '[]');
        allBookings.push(booking);
        localStorage.setItem('appointments', JSON.stringify(allBookings));
        
        // Update slot status
        const slotIndex = allSlots.findIndex(s => s.id === slotId);
        if (slotIndex !== -1) {
            allSlots[slotIndex].status = 'booked';
            allSlots[slotIndex].bookedBy = user.id;
            localStorage.setItem('slots', JSON.stringify(allSlots));
        }
        
        Logger.logStudent('book_appointment', user.id, {
            bookingId: booking.id,
            teacherId: teacherId,
            slotId: slotId
        });
        
        showAlert('Booking request submitted successfully! Waiting for teacher approval.', 'success');
        closeBookingModal();
        
    } catch (error) {
        Logger.error('Student', 'Error submitting booking', { error: error.message });
        showAlert('Error submitting booking. Please try again.', 'error');
    }
}

/**
 * Message teacher
 */
function messageTeacher() {
    const teacher = availableTeachers.find(t => t.id === selectedTeacherId);
    if (!teacher) return;
    
    document.getElementById('messageTeacherId').value = teacher.id;
    document.getElementById('messageTeacherName').value = teacher.name;
    document.getElementById('messageForm').reset();
    document.getElementById('messageModal').style.display = 'block';
    
    Logger.info('Student', 'Message modal opened', { teacherId: teacher.id });
}

/**
 * Close message modal
 */
function closeMessageModal() {
    document.getElementById('messageModal').style.display = 'none';
}

/**
 * Send message to teacher
 */
async function sendMessageToTeacher(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) return;
    
    const teacherId = document.getElementById('messageTeacherId').value;
    const content = document.getElementById('messageContent').value;
    
    try {
        const teacher = availableTeachers.find(t => t.id === teacherId);
        
        const message = {
            id: generateId(),
            studentId: user.id,
            studentName: user.name,
            teacherId: teacherId,
            teacherName: teacher.name,
            sender: 'student',
            content: content,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
        allMessages.push(message);
        localStorage.setItem('messages', JSON.stringify(allMessages));
        
        Logger.logStudent('send_message', user.id, {
            teacherId: teacherId,
            messageId: message.id
        });
        
        showAlert('Message sent successfully!', 'success');
        closeMessageModal();
        
    } catch (error) {
        Logger.error('Student', 'Error sending message', { error: error.message });
        showAlert('Error sending message. Please try again.', 'error');
    }
}

/**
 * Load student bookings
 */
async function loadBookings() {
    try {
        Logger.info('Student', 'Loading bookings', { filter: currentFilter });
        
        const user = getCurrentUser();
        if (!user) return;
        
        const allBookings = JSON.parse(localStorage.getItem('appointments') || '[]');
        studentBookings = allBookings.filter(b => b.studentId === user.id);
        
        // Apply filter
        if (currentFilter !== 'all') {
            const today = new Date();
            switch (currentFilter) {
                case 'upcoming':
                    studentBookings = studentBookings.filter(b => 
                        new Date(b.date) >= today && 
                        (b.status === 'approved' || b.status === 'pending')
                    );
                    break;
                case 'pending':
                    studentBookings = studentBookings.filter(b => b.status === 'pending');
                    break;
                case 'completed':
                    studentBookings = studentBookings.filter(b => b.status === 'completed');
                    break;
                case 'cancelled':
                    studentBookings = studentBookings.filter(b => b.status === 'cancelled');
                    break;
            }
        }
        
        renderBookingsTable();
        
    } catch (error) {
        Logger.error('Student', 'Error loading bookings', { error: error.message });
        showAlert('Error loading bookings', 'error');
    }
}

/**
 * Render bookings table
 */
function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTable');
    const noBookingsDiv = document.getElementById('noBookings');
    
    if (studentBookings.length === 0) {
        tbody.innerHTML = '';
        noBookingsDiv.style.display = 'block';
        return;
    }
    
    noBookingsDiv.style.display = 'none';
    
    // Sort by date
    const sorted = studentBookings.sort((a, b) => 
        new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime)
    );
    
    tbody.innerHTML = sorted.map(booking => `
        <tr>
            <td>${formatDate(booking.date)}<br><small>${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</small></td>
            <td>${booking.teacherName}</td>
            <td>${booking.teacherSubject}</td>
            <td>${booking.purpose}</td>
            <td>${booking.location || 'Not specified'}</td>
            <td>
                <span class="badge badge-${booking.status === 'approved' ? 'success' : booking.status === 'pending' ? 'warning' : booking.status === 'completed' ? 'primary' : 'danger'}">
                    ${booking.status.toUpperCase()}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openBookingModal('${booking.id}')" style="padding: 0.5rem;">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Get booking by ID
 */
function getBookingById(bookingId) {
    return studentBookings.find(b => b.id === bookingId);
}

/**
 * View booking details (from dashboard)
 */
function viewBookingDetails(bookingId) {
    window.location.href = 'book.html';
    sessionStorage.setItem('openBookingId', bookingId);
}

/**
 * Cancel booking
 */
async function cancelBooking() {
    if (!selectedBookingId) return;
    
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        const allBookings = JSON.parse(localStorage.getItem('appointments') || '[]');
        const index = allBookings.findIndex(b => b.id === selectedBookingId);
        
        if (index !== -1) {
            const booking = allBookings[index];
            booking.status = 'cancelled';
            booking.cancelledAt = new Date().toISOString();
            booking.cancelledBy = 'student';
            
            localStorage.setItem('appointments', JSON.stringify(allBookings));
            
            // Free up the slot
            const slots = JSON.parse(localStorage.getItem('slots') || '[]');
            const slotIndex = slots.findIndex(s => s.id === booking.slotId);
            if (slotIndex !== -1) {
                slots[slotIndex].status = 'available';
                slots[slotIndex].bookedBy = null;
                localStorage.setItem('slots', JSON.stringify(slots));
            }
            
            Logger.logStudent('cancel_booking', getCurrentUser()?.id, { 
                bookingId: selectedBookingId 
            });
            
            showAlert('Booking cancelled successfully', 'success');
            closeBookingModal();
            loadBookings();
        }
        
    } catch (error) {
        Logger.error('Student', 'Error cancelling booking', { error: error.message });
        showAlert('Error cancelling booking', 'error');
    }
}

/**
 * Reschedule booking
 */
function rescheduleBooking() {
    alert('Reschedule feature coming soon! Please cancel and create a new booking.');
    Logger.info('Student', 'Reschedule requested', { bookingId: selectedBookingId });
}

/**
 * Refresh bookings
 */
function refreshBookings() {
    Logger.info('Student', 'Bookings refresh requested', {});
    loadBookings();
    showAlert('Bookings refreshed', 'success');
}

/**
 * Load student messages
 */
async function loadStudentMessages() {
    try {
        Logger.info('Student', 'Loading messages', {});
        
        const user = getCurrentUser();
        if (!user) return;
        
        const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
        studentMessages = allMessages.filter(m => m.studentId === user.id);
        
        renderStudentMessageList();
        loadTeachersForMessage();
        
    } catch (error) {
        Logger.error('Student', 'Error loading messages', { error: error.message });
    }
}

/**
 * Render student message list
 */
function renderStudentMessageList() {
    const list = document.getElementById('messageList');
    const unreadCount = studentMessages.filter(m => !m.read && m.sender === 'teacher').length;
    
    document.getElementById('unreadCount').textContent = unreadCount;
    
    // Group messages by teacher
    const threads = {};
    studentMessages.forEach(msg => {
        if (!threads[msg.teacherId]) {
            threads[msg.teacherId] = {
                teacherId: msg.teacherId,
                teacherName: msg.teacherName,
                messages: []
            };
        }
        threads[msg.teacherId].messages.push(msg);
    });
    
    // Sort threads by latest message
    const sortedThreads = Object.values(threads).sort((a, b) => {
        const aLatest = new Date(a.messages[a.messages.length - 1].timestamp);
        const bLatest = new Date(b.messages[b.messages.length - 1].timestamp);
        return bLatest - aLatest;
    });
    
    if (sortedThreads.length === 0) {
        list.innerHTML = '<div class="text-center" style="padding: 2rem;"><p>No messages yet</p></div>';
        return;
    }
    
    list.innerHTML = sortedThreads.map(thread => {
        const latestMsg = thread.messages[thread.messages.length - 1];
        const hasUnread = thread.messages.some(m => !m.read && m.sender === 'teacher');
        
        return `
            <div class="message-thread ${hasUnread ? 'unread' : ''} ${selectedThreadId === thread.teacherId ? 'active' : ''}" 
                 onclick="selectStudentThread('${thread.teacherId}')">
                <div class="thread-avatar">
                    ${thread.teacherName.charAt(0).toUpperCase()}
                </div>
                <div class="thread-info">
                    <div class="thread-name">${thread.teacherName}</div>
                    <div class="thread-preview">${latestMsg.content}</div>
                </div>
                <div class="thread-meta">
                    <div class="thread-time">${new Date(latestMsg.timestamp).toLocaleDateString()}</div>
                    ${hasUnread ? '<span class="badge badge-warning" style="margin-top: 0.25rem;">New</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Select student thread
 */
function selectStudentThread(teacherId) {
    selectedThreadId = teacherId;
    renderStudentMessageList();
    
    const thread = studentMessages.filter(m => m.teacherId === teacherId);
    if (thread.length === 0) return;
    
    const teacherName = thread[0].teacherName;
    
    // Show chat header
    document.getElementById('chatHeader').style.display = 'flex';
    document.getElementById('chatTeacherName').textContent = teacherName;
    document.getElementById('chatTeacherInfo').textContent = 'Teacher';
    
    // Show chat input
    document.getElementById('chatInput').style.display = 'block';
    
    // Render messages
    const chatContainer = document.getElementById('chatMessages');
    chatContainer.innerHTML = thread.map(msg => `
        <div class="chat-message ${msg.sender === 'student' ? 'sent' : 'received'}">
            <div>${msg.content}</div>
            <div class="chat-message-time">${new Date(msg.timestamp).toLocaleString()}</div>
        </div>
    `).join('');
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Mark messages as read
    thread.forEach(msg => {
        if (msg.sender === 'teacher' && !msg.read) {
            msg.read = true;
        }
    });
    
    // Save updated messages
    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
    allMessages.forEach(m => {
        if (m.teacherId === teacherId && m.studentId === getCurrentUser()?.id && m.sender === 'teacher') {
            m.read = true;
        }
    });
    localStorage.setItem('messages', JSON.stringify(allMessages));
    
    renderStudentMessageList();
}

/**
 * Load teachers for new message
 */
function loadTeachersForMessage() {
    const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
    const select = document.getElementById('newMessageTeacher');
    
    if (!select) return;
    
    select.innerHTML = '<option value="">Choose a teacher...</option>';
    
    teachers.filter(t => t.status === 'active').forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = `${teacher.name} (${teacher.department})`;
        select.appendChild(option);
    });
}

/**
 * Open new message modal
 */
function openNewMessageModal() {
    document.getElementById('newMessageForm').reset();
    document.getElementById('newMessageModal').style.display = 'block';
    Logger.info('Student', 'New message modal opened', {});
}

/**
 * Close new message modal
 */
function closeNewMessageModal() {
    document.getElementById('newMessageModal').style.display = 'none';
}

/**
 * Submit new message
 */
async function submitNewMessage(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) return;
    
    const teacherId = document.getElementById('newMessageTeacher').value;
    const content = document.getElementById('newMessageContent').value;
    
    if (!teacherId) {
        showAlert('Please select a teacher', 'error');
        return;
    }
    
    try {
        const teachers = JSON.parse(localStorage.getItem('teachers') || '[]');
        const teacher = teachers.find(t => t.id === teacherId);
        
        if (!teacher) {
            showAlert('Teacher not found', 'error');
            return;
        }
        
        const message = {
            id: generateId(),
            studentId: user.id,
            studentName: user.name,
            teacherId: teacherId,
            teacherName: teacher.name,
            sender: 'student',
            content: content,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
        allMessages.push(message);
        localStorage.setItem('messages', JSON.stringify(allMessages));
        
        Logger.logStudent('send_new_message', user.id, {
            teacherId: teacherId,
            messageId: message.id
        });
        
        showAlert('Message sent successfully!', 'success');
        closeNewMessageModal();
        loadStudentMessages();
        
    } catch (error) {
        Logger.error('Student', 'Error sending new message', { error: error.message });
        showAlert('Error sending message. Please try again.', 'error');
    }
}

/**
 * Send reply
 */
async function sendReply(event) {
    event.preventDefault();
    
    const content = document.getElementById('replyMessage').value.trim();
    if (!content || !selectedThreadId) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
        const teacherMessages = allMessages.filter(m => m.teacherId === selectedThreadId && m.studentId === user.id);
        
        if (teacherMessages.length === 0) return;
        
        const teacherName = teacherMessages[0].teacherName;
        
        const newMessage = {
            id: generateId(),
            studentId: user.id,
            studentName: user.name,
            teacherId: selectedThreadId,
            teacherName: teacherName,
            sender: 'student',
            content: content,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        allMessages.push(newMessage);
        localStorage.setItem('messages', JSON.stringify(allMessages));
        
        Logger.logStudent('send_reply', user.id, {
            teacherId: selectedThreadId,
            messageId: newMessage.id
        });
        
        document.getElementById('replyMessage').value = '';
        
        // Refresh messages
        loadStudentMessages();
        selectStudentThread(selectedThreadId);
        
    } catch (error) {
        Logger.error('Student', 'Error sending reply', { error: error.message });
        showAlert('Error sending reply. Please try again.', 'error');
    }
}

/**
 * Refresh messages
 */
function refreshMessages() {
    Logger.info('Student', 'Messages refresh requested', {});
    loadStudentMessages();
    showAlert('Messages refreshed', 'success');
}

// Close modals when clicking outside
window.onclick = function(event) {
    const teacherModal = document.getElementById('teacherModal');
    const bookingModal = document.getElementById('bookingModal');
    const messageModal = document.getElementById('messageModal');
    const newMessageModal = document.getElementById('newMessageModal');
    
    if (event.target === teacherModal) {
        closeTeacherModal();
    }
    if (event.target === bookingModal) {
        closeBookingModal();
    }
    if (event.target === messageModal) {
        closeMessageModal();
    }
    if (event.target === newMessageModal) {
        closeNewMessageModal();
    }
}
