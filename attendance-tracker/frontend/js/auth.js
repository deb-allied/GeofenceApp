/**
 * Authentication-related functionality
 */
class AuthService {
    /**
     * Check if the user is currently authenticated
     * @returns {boolean} True if authenticated, false otherwise
     */
    static isAuthenticated() {
        return !!localStorage.getItem(CONFIG.STORAGE_TOKEN_KEY);
    }

    /**
     * Get the current user data
     * @returns {Object|null} User data or null if not authenticated
     */
    static getCurrentUser() {
        const userJson = localStorage.getItem(CONFIG.STORAGE_USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    }

    /**
     * Get the authentication token
     * @returns {string|null} The token or null if not authenticated
     */
    static getToken() {
        return localStorage.getItem(CONFIG.STORAGE_TOKEN_KEY);
    }

    /**
     * Set the authentication data
     * @param {string} token - The authentication token
     * @param {Object} user - The user data
     */
    static setAuth(token, user) {
        localStorage.setItem(CONFIG.STORAGE_TOKEN_KEY, token);
        localStorage.setItem(CONFIG.STORAGE_USER_KEY, JSON.stringify(user));
    }

    /**
     * Clear the authentication data
     */
    static clearAuth() {
        localStorage.removeItem(CONFIG.STORAGE_TOKEN_KEY);
        localStorage.removeItem(CONFIG.STORAGE_USER_KEY);
    }

    /**
     * Register a new user
     * @param {Object} userData - The user registration data
     * @returns {Promise<Object>} The API response
     */
    static async register(userData) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Registration failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    /**
     * Log in a user
     * @param {string} username - The username
     * @param {string} password - The password
     * @returns {Promise<Object>} The token response
     */
    static async login(username, password) {
        try {
            // Format data as form data for FastAPI token endpoint
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Login failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Get the current user profile
     * @returns {Promise<Object>} The user profile
     */
    static async getProfile() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`,
                },
            });

            if (!response.ok) {
                // If unauthorized, clear auth data
                if (response.status === 401) {
                    this.clearAuth();
                }
                const error = await response.json();
                throw new Error(error.detail || 'Failed to fetch profile');
            }

            return await response.json();
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }

    /**
     * Log out the current user
     */
    static logout() {
        this.clearAuth();
        // Redirect to login page
        location.reload();
    }
}

// DOM event listeners for auth elements
document.addEventListener('DOMContentLoaded', () => {
    // Show register form
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('register-container').style.display = 'block';
    });

    // Show login form
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-container').style.display = 'none';
        document.getElementById('login-container').style.display = 'block';
    });

    // Register form submission
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userData = {
            email: document.getElementById('reg-email').value,
            username: document.getElementById('reg-username').value,
            full_name: document.getElementById('reg-fullname').value,
            password: document.getElementById('reg-password').value,
        };

        try {
            await AuthService.register(userData);
            // Show login form after successful registration
            document.getElementById('register-container').style.display = 'none';
            document.getElementById('login-container').style.display = 'block';
            showError('Registration successful! Please login.');
            
            // Clear the form
            document.getElementById('register-form').reset();
        } catch (error) {
            showError(error.message);
        }
    });

    // Login form submission
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const tokenData = await AuthService.login(username, password);
            // Get user profile with the token
            AuthService.setAuth(tokenData.access_token, null);
            const userData = await AuthService.getProfile();
            
            // Update auth with full user data
            AuthService.setAuth(tokenData.access_token, userData);
            
            // Refresh the page to show dashboard
            location.reload();
        } catch (error) {
            showError(error.message);
        }
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', () => {
        AuthService.logout();
    });
});