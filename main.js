/**
 * Main JavaScript for Student-Teacher Booking Appointment System
 * Landing page functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Logger
    if (typeof Logger !== 'undefined') {
        Logger.info('Main', 'Landing page loaded', {
            path: window.location.pathname
        });
    }

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            if (typeof Logger !== 'undefined') {
                Logger.debug('UI', 'Mobile menu toggled', {
                    state: navMenu.classList.contains('active') ? 'open' : 'closed'
                });
            }
        });
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                if (typeof Logger !== 'undefined') {
                    Logger.debug('UI', 'Smooth scroll to section', {
                        target: this.getAttribute('href')
                    });
                }
            }
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('roleModal');
        if (e.target === modal) {
            closeRoleModal();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeRoleModal();
        }
    });
});

/**
 * Show role selection modal
 */
function showRoleModal() {
    const modal = document.getElementById('roleModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        if (typeof Logger !== 'undefined') {
            Logger.info('UI', 'Role selection modal opened', {});
        }
    }
}

/**
 * Close role selection modal
 */
function closeRoleModal() {
    const modal = document.getElementById('roleModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        if (typeof Logger !== 'undefined') {
            Logger.info('UI', 'Role selection modal closed', {});
        }
    }
}

/**
 * Navigate to role-specific page
 * @param {string} role - 'admin', 'teacher', or 'student'
 */
function navigateTo(role) {
    if (typeof Logger !== 'undefined') {
        Logger.info('Navigation', `Navigating to ${role} section`, {
            role: role,
            destination: `pages/${role}/dashboard.html`
        });
    }

    // Close modal
    closeRoleModal();

    // Navigate to role-specific page
    const destinations = {
        'admin': 'pages/admin/dashboard.html',
        'teacher': 'pages/teacher/dashboard.html',
        'student': 'pages/student/dashboard.html'
    };

    const destination = destinations[role];
    if (destination) {
        window.location.href = destination;
    } else {
        console.error('Unknown role:', role);
        if (typeof Logger !== 'undefined') {
            Logger.error('Navigation', 'Unknown role selected', { role: role });
        }
    }
}

/**
 * Scroll to specific section
 * @param {string} sectionId - Section ID to scroll to
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        if (typeof Logger !== 'undefined') {
            Logger.debug('UI', 'Scrolled to section', { section: sectionId });
        }
    }
}

/**
 * Utility function to show alert messages
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, error, warning)
 */
function showAlert(message, type = 'success') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insert at top of main content
    const mainContent = document.querySelector('.main-content') || document.body;
    mainContent.insertBefore(alertDiv, mainContent.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);

    if (typeof Logger !== 'undefined') {
        Logger.info('UI', 'Alert shown', {
            message: message,
            type: type
        });
    }
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format time for display
 * @param {string} time - Time to format
 * @returns {string} Formatted time string
 */
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if user is logged in
 * @returns {Object|null} User data or null
 */
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

/**
 * Set current user
 * @param {Object} user - User data
 */
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (typeof Logger !== 'undefined') {
        Logger.info('Auth', 'User session set', {
            userId: user.id,
            role: user.role
        });
    }
}

/**
 * Clear current user (logout)
 */
function clearCurrentUser() {
    const user = getCurrentUser();
    if (user && typeof Logger !== 'undefined') {
        Logger.info('Auth', 'User session cleared', {
            userId: user.id,
            role: user.role
        });
    }
    localStorage.removeItem('currentUser');
}

/**
 * Require authentication
 * @param {string} role - Required role
 */
function requireAuth(role) {
    const user = getCurrentUser();
    
    if (!user) {
        if (typeof Logger !== 'undefined') {
            Logger.warn('Auth', 'Unauthorized access attempt', {
                requiredRole: role,
                path: window.location.pathname
            });
        }
        alert('Please login to access this page');
        window.location.href = '../../index.html';
        return false;
    }

    if (role && user.role !== role) {
        if (typeof Logger !== 'undefined') {
            Logger.warn('Auth', 'Role mismatch', {
                userRole: user.role,
                requiredRole: role
            });
        }
        alert('You do not have permission to access this page');
        window.location.href = '../../index.html';
        return false;
    }

    return true;
}

/**
 * Logout user
 */
function logout() {
    const user = getCurrentUser();
    if (user && typeof Logger !== 'undefined') {
        Logger.logAuth('logout', user.id, true, {
            role: user.role,
            timestamp: new Date().toISOString()
        });
    }
    
    clearCurrentUser();
    window.location.href = '../../index.html';
}

// Export functions for use in other modules
window.showAlert = showAlert;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.generateId = generateId;
window.debounce = debounce;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.clearCurrentUser = clearCurrentUser;
window.requireAuth = requireAuth;
window.logout = logout;
