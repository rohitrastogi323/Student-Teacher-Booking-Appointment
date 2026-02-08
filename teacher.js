/**
 * Teacher Module JavaScript
 * Handles all teacher-related functionality
 */

// Global variables
let teacherSlots = [];
let teacherAppointments = [];
let teacherMessages = [];
let currentWeekOffset = 0;
let selectedSlotId = null;

/**
 * Load teacher dashboard data
 */
async function loadTeacherDashboard() {
    try {
        Logger.info('Teacher', 'Loading dashboard data', {});
        
        // Load statistics
        await loadTeacherStats();
        
        // Load upcoming appointments
        loadUpcomingAppointments();
        
        // Update teacher name
        const user = getCurrentUser();
        if (user) {
            document.getElementById('teacherName').textContent = user.name || 'Teacher';
        }
        
    } catch (error) {
        Logger.error('Teacher', 'Error loading dashboard', { error: error.message });
        showAlert('Error loading dashboard data', 'error');
    }
}

/**
 * Load teacher statistics
 */
async function loadTeacherStats() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        // Load appointments for this teacher
        const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const teacherAppts = allAppointments.filter(a => a.teacherId === user.id);
        
        // Today's appointments
        const today = new Date().toISOString().split('T')[0];
        const todayCount = teacherAppts.filter(a => a.date === today && a.status !== 'cancelled').length;
        document.getElementById('todayAppointments').textContent = todayCount;
        
        // Pending requests
        const pendingCount = teacherAppts.filter(a => a.status === 'pending').length;
        document.getElementById('pendingRequests').textContent = pendingCount;
        
        // Total unique students
        const uniqueStudents = new Set(teacherAppts.map(a => a.studentId)).size;
        document.getElementById('totalStudentsMet').textContent = uniqueStudents;
        
        // New messages
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        const unreadCount = messages.filter(m => m.teacherId === user.id && !m.read && m.sender === 'student').length;
        document.getElementById('newMessages').textContent = unreadCount;
        
        Logger.info('Teacher', 'Statistics loaded', {
            today: todayCount,
            pending: pendingCount,
            students: uniqueStudents,
            messages: unreadCount
        });
        
    } catch (error) {
        Logger.error('Teacher', 'Error loading statistics', { error: error.message });
    }
}

/**
 * Load upcoming appointments
 */
function loadUpcomingAppointments() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const teacherAppts = allAppointments.filter(a => 
            a.teacherId === user.id && 
            a.status !== 'cancelled' &&
            a.status !== 'completed' &&
            new Date(a.date) >= new Date()
        ).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);
        
        const tbody = document.getElementById('upcomingTable');
        
        if (teacherAppts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No upcoming appointments</td></tr>';
            return;
        }
        
        tbody.innerHTML = teacherAppts.map(apt => `
            <tr>
                <td>${formatDate(apt.date)}</td>
                <td>${formatTime(apt.startTime)}</td>
                <td>${apt.studentName}</td>
                <td>${apt.purpose}</td>
                <td>
                    <span class="badge badge-${apt.status === 'approved' ? 'success' : 'warning'}">
                        ${apt.status.toUpperCase()}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewAppointmentDetails('${apt.id}')" style="padding: 0.5rem;">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        Logger.error('Teacher', 'Error loading upcoming appointments', { error: error.message });
    }
}

/**
 * Load schedule data
 */
async function loadSchedule() {
    try {
        Logger.info('Teacher', 'Loading schedule', {});
        
        const user = getCurrentUser();
        if (!user) return;
        
        // Load slots from localStorage
        const allSlots = JSON.parse(localStorage.getItem('slots') || '[]');
        teacherSlots = allSlots.filter(s => s.teacherId === user.id);
        
        renderScheduleGrid();
        renderSlotsTable();
        
    } catch (error) {
        Logger.error('Teacher', 'Error loading schedule', { error: error.message });
        showAlert('Error loading schedule', 'error');
    }
}

/**
 * Render schedule grid
 */
function renderScheduleGrid() {
    const grid = document.getElementById('scheduleGrid');
    const weekStart = getWeekStart(currentWeekOffset);
    
    // Update week label
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    document.getElementById('currentWeek').textContent = 
        `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
    
    // Generate 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let html = '';
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Get slots for this day
        const daySlots = teacherSlots.filter(s => s.date === dateStr);
        
        html += `
            <div style="background: white; border-radius: var(--radius-lg); padding: 1rem; min-height: 150px;">
                <div style="text-align: center; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--gray-200);">
                    <div style="font-size: 0.875rem; color: var(--gray-600);">${days[date.getDay()]}</div>
                    <div style="font-size: 1.25rem; font-weight: 600; color: var(--dark-color);">${date.getDate()}</div>
                    <div style="font-size: 0.75rem; color: var(--gray-600);">${months[date.getMonth()]}</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                    ${daySlots.length > 0 ? daySlots.map(slot => `
                        <div style="padding: 0.25rem 0.5rem; background: ${slot.status === 'booked' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; 
                                    border-radius: var(--radius-sm); font-size: 0.75rem; text-align: center;
                                    color: ${slot.status === 'booked' ? 'var(--warning-color)' : 'var(--success-color)'};">
                            ${formatTime(slot.startTime)}
                        </div>
                    `).join('') : '<div style="text-align: center; color: var(--gray-400); font-size: 0.75rem;">No slots</div>'}
                </div>
            </div>
        `;
    }
    
    grid.innerHTML = html;
}

/**
 * Get week start date
 */
function getWeekStart(offset = 0) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (offset * 7);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
}

/**
 * Navigate to previous week
 */
function previousWeek() {
    currentWeekOffset--;
    renderScheduleGrid();
}

/**
 * Navigate to next week
 */
function nextWeek() {
    currentWeekOffset++;
    renderScheduleGrid();
}

/**
 * Render slots table
 */
function renderSlotsTable(filteredSlots = null) {
    const displaySlots = filteredSlots || teacherSlots.sort((a, b) => 
        new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime)
    );
    
    const tbody = document.getElementById('slotsTable');
    
    if (displaySlots.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No time slots scheduled</td></tr>';
        return;
    }
    
    tbody.innerHTML = displaySlots.map(slot => `
        <tr>
            <td>${formatDate(slot.date)}</td>
            <td>${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}</td>
            <td>${calculateDuration(slot.startTime, slot.endTime)}</td>
            <td>
                <span class="badge badge-${slot.status === 'booked' ? 'warning' : slot.status === 'completed' ? 'primary' : 'success'}">
                    ${slot.status ? slot.status.toUpperCase() : 'AVAILABLE'}
                </span>
            </td>
            <td>${slot.bookedBy || '-'}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteSlot('${slot.id}')" style="padding: 0.5rem;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Calculate duration between two times
 */
function calculateDuration(start, end) {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const diff = (endH * 60 + endM) - (startH * 60 + startM);
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/**
 * Filter slots by status
 */
function filterSlots() {
    const status = document.getElementById('filterStatus').value;
    
    if (status === 'all') {
        renderSlotsTable();
    } else {
        const filtered = teacherSlots.filter(s => s.status === status);
        renderSlotsTable(filtered);
    }
}

/**
 * Open add slot modal
 */
function openAddSlotModal() {
    document.getElementById('slotForm').reset();
    document.getElementById('slotModal').style.display = 'block';
    
    Logger.info('Teacher', 'Add slot modal opened', {});
}

/**
 * Close slot modal
 */
function closeSlotModal() {
    document.getElementById('slotModal').style.display = 'none';
}

/**
 * Save time slot
 */
async function saveSlot(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) return;
    
    const slotData = {
        id: generateId(),
        teacherId: user.id,
        teacherName: user.name,
        date: document.getElementById('slotDate').value,
        startTime: document.getElementById('slotStartTime').value,
        endTime: document.getElementById('slotEndTime').value,
        location: document.getElementById('slotLocation').value,
        notes: document.getElementById('slotNotes').value,
        status: 'available',
        recurring: document.getElementById('slotRecurring').checked,
        createdAt: new Date().toISOString()
    };
    
    try {
        // Validate time
        if (slotData.startTime >= slotData.endTime) {
            showAlert('End time must be after start time', 'error');
            return;
        }
        
        // Check for conflicts
        const conflicting = teacherSlots.filter(s => 
            s.date === slotData.date &&
            ((slotData.startTime >= s.startTime && slotData.startTime < s.endTime) ||
             (slotData.endTime > s.startTime && slotData.endTime <= s.endTime))
        );
        
        if (conflicting.length > 0) {
            showAlert('This time slot conflicts with an existing slot', 'error');
            return;
        }
        
        // Save slot
        teacherSlots.push(slotData);
        
        // If recurring, create slots for next 4 weeks
        if (slotData.recurring) {
            for (let i = 1; i <= 4; i++) {
                const nextDate = new Date(slotData.date);
                nextDate.setDate(nextDate.getDate() + (i * 7));
                
                const recurringSlot = {
                    ...slotData,
                    id: generateId(),
                    date: nextDate.toISOString().split('T')[0],
                    parentSlotId: slotData.id
                };
                
                teacherSlots.push(recurringSlot);
            }
        }
        
        // Save to localStorage
        const allSlots = JSON.parse(localStorage.getItem('slots') || '[]');
        allSlots.push(...(slotData.recurring ? teacherSlots.slice(-5) : [slotData]));
        localStorage.setItem('slots', JSON.stringify(allSlots));
        
        Logger.logTeacher('add_slot', user.id, { slotId: slotData.id, date: slotData.date });
        showAlert('Time slot(s) added successfully', 'success');
        
        closeSlotModal();
        loadSchedule();
        
    } catch (error) {
        Logger.error('Teacher', 'Error saving slot', { error: error.message });
        showAlert('Error saving time slot', 'error');
    }
}

/**
 * Delete time slot
 */
async function deleteSlot(slotId) {
    if (!confirm('Are you sure you want to delete this time slot?')) return;
    
    try {
        teacherSlots = teacherSlots.filter(s => s.id !== slotId);
        
        // Update localStorage
        const allSlots = JSON.parse(localStorage.getItem('slots') || '[]');
        const updatedSlots = allSlots.filter(s => s.id !== slotId);
        localStorage.setItem('slots', JSON.stringify(updatedSlots));
        
        Logger.logTeacher('delete_slot', getCurrentUser()?.id, { slotId: slotId });
        showAlert('Time slot deleted', 'success');
        
        loadSchedule();
        
    } catch (error) {
        Logger.error('Teacher', 'Error deleting slot', { error: error.message });
        showAlert('Error deleting time slot', 'error');
    }
}

/**
 * Load appointments
 */
async function loadAppointments() {
    try {
        Logger.info('Teacher', 'Loading appointments', { filter: currentFilter });
        
        const user = getCurrentUser();
        if (!user) return;
        
        const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        teacherAppointments = allAppointments.filter(a => a.teacherId === user.id);
        
        if (currentFilter !== 'all') {
            teacherAppointments = teacherAppointments.filter(a => a.status === currentFilter);
        }
        
        renderAppointmentsTable();
        
    } catch (error) {
        Logger.error('Teacher', 'Error loading appointments', { error: error.message });
        showAlert('Error loading appointments', 'error');
    }
}

/**
 * Render appointments table
 */
function renderAppointmentsTable() {
    const tbody = document.getElementById('appointmentsTable');
    const noApptsDiv = document.getElementById('noAppointments');
    
    if (teacherAppointments.length === 0) {
        tbody.innerHTML = '';
        noApptsDiv.style.display = 'block';
        return;
    }
    
    noApptsDiv.style.display = 'none';
    
    // Sort by date
    const sorted = teacherAppointments.sort((a, b) => 
        new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime)
    );
    
    tbody.innerHTML = sorted.map(apt => `
        <tr>
            <td>${formatDate(apt.date)}</td>
            <td>${formatTime(apt.startTime)} - ${formatTime(apt.endTime)}</td>
            <td>${apt.studentName}</td>
            <td>${apt.purpose}</td>
            <td>${apt.location || 'Not specified'}</td>
            <td>
                <span class="badge badge-${apt.status === 'approved' ? 'success' : apt.status === 'pending' ? 'warning' : apt.status === 'completed' ? 'primary' : 'danger'}">
                    ${apt.status.toUpperCase()}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openAppointmentModal('${apt.id}')" style="padding: 0.5rem;">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Get appointment by ID
 */
function getAppointmentById(appointmentId) {
    return teacherAppointments.find(a => a.id === appointmentId);
}

/**
 * View appointment details (from dashboard)
 */
function viewAppointmentDetails(appointmentId) {
    window.location.href = 'appointments.html';
    // Store the ID to open modal after page load
    sessionStorage.setItem('openAppointmentId', appointmentId);
}

/**
 * Approve appointment
 */
async function approveAppointment() {
    if (!selectedAppointmentId) return;
    
    try {
        const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const index = allAppointments.findIndex(a => a.id === selectedAppointmentId);
        
        if (index !== -1) {
            allAppointments[index].status = 'approved';
            allAppointments[index].approvedAt = new Date().toISOString();
            
            localStorage.setItem('appointments', JSON.stringify(allAppointments));
            
            Logger.logTeacher('approve_appointment', getCurrentUser()?.id, { 
                appointmentId: selectedAppointmentId 
            });
            
            showAlert('Appointment approved successfully', 'success');
            closeAppointmentModal();
            loadAppointments();
        }
        
    } catch (error) {
        Logger.error('Teacher', 'Error approving appointment', { error: error.message });
        showAlert('Error approving appointment', 'error');
    }
}

/**
 * Cancel appointment
 */
async function cancelAppointment() {
    if (!selectedAppointmentId) return;
    
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
        const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const index = allAppointments.findIndex(a => a.id === selectedAppointmentId);
        
        if (index !== -1) {
            allAppointments[index].status = 'cancelled';
            allAppointments[index].cancelledAt = new Date().toISOString();
            allAppointments[index].cancelledBy = 'teacher';
            
            localStorage.setItem('appointments', JSON.stringify(allAppointments));
            
            // Free up the slot
            const slots = JSON.parse(localStorage.getItem('slots') || '[]');
            const slotIndex = slots.findIndex(s => s.id === allAppointments[index].slotId);
            if (slotIndex !== -1) {
                slots[slotIndex].status = 'available';
                slots[slotIndex].bookedBy = null;
                localStorage.setItem('slots', JSON.stringify(slots));
            }
            
            Logger.logTeacher('cancel_appointment', getCurrentUser()?.id, { 
                appointmentId: selectedAppointmentId 
            });
            
            showAlert('Appointment cancelled', 'warning');
            closeAppointmentModal();
            loadAppointments();
        }
        
    } catch (error) {
        Logger.error('Teacher', 'Error cancelling appointment', { error: error.message });
        showAlert('Error cancelling appointment', 'error');
    }
}

/**
 * Complete appointment
 */
async function completeAppointment() {
    if (!selectedAppointmentId) return;
    
    try {
        const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const index = allAppointments.findIndex(a => a.id === selectedAppointmentId);
        
        if (index !== -1) {
            allAppointments[index].status = 'completed';
            allAppointments[index].completedAt = new Date().toISOString();
            
            localStorage.setItem('appointments', JSON.stringify(allAppointments));
            
            Logger.logTeacher('complete_appointment', getCurrentUser()?.id, { 
                appointmentId: selectedAppointmentId 
            });
            
            showAlert('Appointment marked as completed', 'success');
            closeAppointmentModal();
            loadAppointments();
        }
        
    } catch (error) {
        Logger.error('Teacher', 'Error completing appointment', { error: error.message });
        showAlert('Error completing appointment', 'error');
    }
}

/**
 * Refresh appointments
 */
function refreshAppointments() {
    Logger.info('Teacher', 'Appointments refresh requested', {});
    loadAppointments();
    showAlert('Appointments refreshed', 'success');
}

/**
 * Load messages
 */
async function loadMessages() {
    try {
        Logger.info('Teacher', 'Loading messages', {});
        
        const user = getCurrentUser();
        if (!user) return;
        
        const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
        teacherMessages = allMessages.filter(m => m.teacherId === user.id);
        
        renderMessageList();
        
    } catch (error) {
        Logger.error('Teacher', 'Error loading messages', { error: error.message });
    }
}

/**
 * Render message list
 */
function renderMessageList() {
    const list = document.getElementById('messageList');
    const unreadCount = teacherMessages.filter(m => !m.read && m.sender === 'student').length;
    
    document.getElementById('unreadCount').textContent = unreadCount;
    
    // Group messages by student
    const threads = {};
    teacherMessages.forEach(msg => {
        if (!threads[msg.studentId]) {
            threads[msg.studentId] = {
                studentId: msg.studentId,
                studentName: msg.studentName,
                messages: []
            };
        }
        threads[msg.studentId].messages.push(msg);
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
        const hasUnread = thread.messages.some(m => !m.read && m.sender === 'student');
        
        return `
            <div class="message-thread ${hasUnread ? 'unread' : ''} ${selectedThreadId === thread.studentId ? 'active' : ''}" 
                 onclick="selectThread('${thread.studentId}')">
                <div class="thread-avatar">
                    ${thread.studentName.charAt(0).toUpperCase()}
                </div>
                <div class="thread-info">
                    <div class="thread-name">${thread.studentName}</div>
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
 * Select message thread
 */
function selectThread(studentId) {
    selectedThreadId = studentId;
    renderMessageList();
    
    const thread = teacherMessages.filter(m => m.studentId === studentId);
    if (thread.length === 0) return;
    
    const studentName = thread[0].studentName;
    
    // Show chat header
    document.getElementById('chatHeader').style.display = 'flex';
    document.getElementById('chatStudentName').textContent = studentName;
    document.getElementById('chatStudentInfo').textContent = 'Student';
    
    // Show chat input
    document.getElementById('chatInput').style.display = 'block';
    
    // Render messages
    const chatContainer = document.getElementById('chatMessages');
    chatContainer.innerHTML = thread.map(msg => `
        <div class="chat-message ${msg.sender === 'teacher' ? 'sent' : 'received'}">
            <div>${msg.content}</div>
            <div class="chat-message-time">${new Date(msg.timestamp).toLocaleString()}</div>
        </div>
    `).join('');
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Mark messages as read
    thread.forEach(msg => {
        if (msg.sender === 'student' && !msg.read) {
            msg.read = true;
        }
    });
    
    // Save updated messages
    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
    allMessages.forEach(m => {
        if (m.studentId === studentId && m.teacherId === getCurrentUser()?.id && m.sender === 'student') {
            m.read = true;
        }
    });
    localStorage.setItem('messages', JSON.stringify(allMessages));
    
    renderMessageList();
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
    
    const newMessage = {
        id: generateId(),
        teacherId: user.id,
        studentId: selectedThreadId,
        studentName: document.getElementById('chatStudentName').textContent,
        sender: 'teacher',
        content: content,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    try {
        const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
        allMessages.push(newMessage);
        localStorage.setItem('messages', JSON.stringify(allMessages));
        
        Logger.logTeacher('send_message', user.id, { 
            studentId: selectedThreadId,
            messageId: newMessage.id
        });
        
        document.getElementById('replyMessage').value = '';
        
        // Refresh messages
        loadMessages();
        selectThread(selectedThreadId);
        
    } catch (error) {
        Logger.error('Teacher', 'Error sending message', { error: error.message });
        showAlert('Error sending message', 'error');
    }
}

/**
 * Mark all messages as read
 */
function markAllAsRead() {
    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]');
    const user = getCurrentUser();
    
    allMessages.forEach(m => {
        if (m.teacherId === user?.id && m.sender === 'student') {
            m.read = true;
        }
    });
    
    localStorage.setItem('messages', JSON.stringify(allMessages));
    
    Logger.info('Teacher', 'All messages marked as read', {});
    showAlert('All messages marked as read', 'success');
    
    loadMessages();
}

/**
 * Refresh messages
 */
function refreshMessages() {
    Logger.info('Teacher', 'Messages refresh requested', {});
    loadMessages();
    showAlert('Messages refreshed', 'success');
}

// Close modals when clicking outside
window.onclick = function(event) {
    const slotModal = document.getElementById('slotModal');
    const appointmentModal = document.getElementById('appointmentModal');
    
    if (event.target === slotModal) {
        closeSlotModal();
    }
    if (event.target === appointmentModal) {
        closeAppointmentModal();
    }
}
