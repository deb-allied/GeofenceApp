/**
 * Main application initialization
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the application based on auth state
    initApp();
});

/**
 * Initialize the application
 */
async function initApp() {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Check if user is authenticated
    if (AuthService.isAuthenticated()) {
        try {
            // Try to get user profile to validate token
            const user = await AuthService.getProfile();
            
            // Update UI
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'none';
            dashboardContainer.style.display = 'block';
            userDisplay.textContent = `Logged in as: ${user.username}`;
            logoutBtn.style.display = 'block';
            
            // Initialize map
            locationService.initMap();
            
            // Load attendance data
            await loadAttendanceData();
        } catch (error) {
            // If token is invalid, clear auth and show login
            AuthService.clearAuth();
            loginContainer.style.display = 'block';
            registerContainer.style.display = 'none';
            dashboardContainer.style.display = 'none';
            userDisplay.textContent = 'Not logged in';
            logoutBtn.style.display = 'none';
            
            console.error('Auth validation error:', error);
        }
    } else {
        // Not authenticated, show login
        loginContainer.style.display = 'block';
        registerContainer.style.display = 'none';
        dashboardContainer.style.display = 'none';
        userDisplay.textContent = 'Not logged in';
        logoutBtn.style.display = 'none';
    }
}

/**
 * Load attendance data for the dashboard
 */
async function loadAttendanceData() {
    try {
        // Get current attendance status
        const status = await AttendanceService.getCurrentStatus();
        AttendanceService.updateStatusUI(status);
        
        // Get attendance history
        const history = await AttendanceService.getHistory();
        AttendanceService.updateHistoryTable(history);
    } catch (error) {
        console.error('Error loading attendance data:', error);
        showError(error.message);
    }
}