# Geofence-Based Attendance Tracker

A complete attendance tracking system that uses geofencing to allow employees to check in and out only when they are physically present at office locations. The system includes role-based access control, detailed activity logging, and a comprehensive admin panel.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [User Roles](#user-roles)
- [File Structure](#file-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

This attendance tracking system is designed for organizations with multiple office locations. It uses geofencing technology to ensure employees can only check in when they are physically present at an office location. The system provides a hierarchical user management system, detailed activity logging, and a comprehensive dashboard for administrators.

## Features

### Core Features
- **Geofencing**: Uses location-based technology to verify user presence at office locations
- **Multiple Office Support**: Allows configuration of multiple office locations with custom geofence radii
- **Check-in/Check-out**: Records employee attendance with timestamps and location data
- **Interactive Maps**: Visual representation of office locations and user position
- **Attendance History**: Comprehensive record of attendance for reporting and analysis

### Admin Features
- **User Management**: Create, update, and delete user accounts
- **Office Management**: Define and manage multiple office locations with custom geofences
- **Role-Based Access**: Three-tier user access (regular users, admins, super admins)
- **Activity Monitoring**: Track login/logout events and attendance records
- **Dashboard Analytics**: Overview of system usage and attendance metrics

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Secure password storage using bcrypt
- **Session Tracking**: Monitor active user sessions
- **Audit Trail**: Comprehensive logging of all user activities

## System Architecture

The application follows a client-server architecture:

### Backend
- **FastAPI**: Modern, high-performance Python web framework
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Relational database for data storage
- **JWT**: Token-based authentication
- **Pydantic**: Data validation and settings management

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **HTML5/CSS3**: Modern, responsive design
- **Leaflet.js**: Interactive maps for geofencing visualization

## User Roles

### Regular User
- Can log in and view the attendance dashboard
- Can check in/out when within a geofence
- Can view their own attendance history

### Admin
- All regular user capabilities
- Can manage regular users (create, update, delete)
- Can manage office locations and geofences
- Can view activity logs and attendance records for all users

### Super Admin
- All admin capabilities
- Can create and manage other admins
- Access to system-wide configurations
- Cannot be deleted or demoted by other admins

## File Structure

```
attendance-tracker/
├── backend/
│   ├── pyproject.toml        # Poetry package management
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app initialization
│   │   ├── config.py         # Configuration settings
│   │   ├── logger.py         # Logger configuration
│   │   ├── api/              # API endpoints
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   ├── admin.py      # Admin endpoints
│   │   │   ├── offices.py    # Office management endpoints
│   │   │   └── attendance.py # Attendance tracking endpoints
│   │   ├── core/             # Core functionality
│   │   │   ├── auth.py       # Authentication logic
│   │   │   └── geofence.py   # Geofencing logic
│   │   ├── db/               # Database operations
│   │   │   └── base.py       # Database connection
│   │   ├── models/           # Database models
│   │   │   └── models.py     # SQLAlchemy models
│   │   └── schemas/          # Pydantic schemas
│   │       └── schemas.py    # Data validation schemas
├── frontend/
│   ├── index.html            # Main user application
│   ├── admin.html            # Admin panel
│   ├── css/
│   │   ├── styles.css        # Main styles
│   │   └── admin.css         # Admin panel styles
│   ├── js/
│   │   ├── app.js            # Main application logic
│   │   ├── auth.js           # Authentication functionality
│   │   ├── attendance.js     # Attendance tracking
│   │   ├── location.js       # Geolocation and mapping
│   │   ├── config.js         # Configuration
│   │   └── admin/            # Admin panel scripts
│   │       ├── admin.js      # Main admin panel logic
│   │       ├── admin-auth.js # Admin authentication
│   │       ├── admin-users.js # User management
│   │       ├── admin-offices.js # Office management
│   │       ├── admin-activity.js # Activity logging
│   │       └── admin-dashboard.js # Dashboard statistics
```

## Installation

### Prerequisites
- Python 3.12+
- PostgreSQL
- Node.js (optional, for development tools)

### Backend Setup

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/attendance-tracker.git
cd attendance-tracker
```

2. **Install Poetry** (Python dependency management):
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

3. **Install backend dependencies**:
```bash
cd backend
poetry install
```

4. **Create a PostgreSQL database**:
```sql
CREATE DATABASE attendance_tracker;
CREATE USER attendance_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE attendance_tracker TO attendance_user;
```

5. **Set up environment variables** (create a `.env` file in the backend directory):
```
POSTGRES_SERVER=localhost
POSTGRES_USER=attendance_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=attendance_tracker
SECRET_KEY=your_very_long_random_secret_key
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=secure_initial_password
```

6. **Initialize the database**:
```bash
cd backend
poetry run alembic revision --autogenerate -m "Initial migration"
poetry run alembic upgrade head
```

### Frontend Setup

No build step is required for the frontend. The application uses vanilla JavaScript and can be served from any static file server.

## Configuration

### Backend Configuration

Key configuration files:
- `app/config.py`: Application settings
- `.env`: Environment-specific variables

Important configuration parameters:
- `SECRET_KEY`: Used for JWT token generation
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token validity period
- `GEOFENCE_RADIUS_METERS`: Default radius for new geofences
- Database connection parameters

### Frontend Configuration

Configure the frontend in `js/config.js`:
- `API_URL`: Backend API endpoint
- `DEFAULT_MAP_CENTER`: Default map location
- `DEFAULT_MAP_ZOOM`: Default map zoom level
- `GEOFENCE_RADIUS_METERS`: Default radius for new geofences
- Various appearance settings for maps and UI

## Running the Application

### Development Environment

1. **Start the backend server**:
```bash
cd backend
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. **Serve the frontend**:
```bash
cd frontend
python -m http.server 3000
```

3. **Access the application**:
- Main application: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin.html`
- API documentation: `http://localhost:8000/docs`

### First Login

When the application starts for the first time, it automatically creates a super admin user with the credentials specified in the environment variables:

- Username: `SUPER_ADMIN_USERNAME` from .env
- Password: `SUPER_ADMIN_PASSWORD` from .env

**Important**: Change the default password immediately after first login.

## API Endpoints

### Authentication
- `POST /api/v1/auth/login`: User login (get JWT token)
- `POST /api/v1/auth/logout`: User logout (record session end)
- `GET /api/v1/auth/me`: Get current user profile

### Attendance
- `POST /api/v1/attendance/check-location`: Check if user is within any geofence
- `POST /api/v1/attendance/check-in`: Check in at current location
- `POST /api/v1/attendance/check-out`: Check out from current location
- `GET /api/v1/attendance/history`: Get user's attendance history
- `GET /api/v1/attendance/status`: Get current attendance status

### Offices
- `GET /api/v1/offices`: List all offices
- `POST /api/v1/offices`: Create new office (admin only)
- `GET /api/v1/offices/{office_id}`: Get specific office
- `PUT /api/v1/offices/{office_id}`: Update office (admin only)
- `DELETE /api/v1/offices/{office_id}`: Delete office (admin only)

### Admin
- `GET /api/v1/admin/users`: List all users (admin only)
- `POST /api/v1/admin/users`: Create new user (admin only)
- `GET /api/v1/admin/users/{user_id}`: Get specific user (admin only)
- `PUT /api/v1/admin/users/{user_id}`: Update user (admin only)
- `DELETE /api/v1/admin/users/{user_id}`: Delete user (admin only)
- `GET /api/v1/admin/login-history`: Get login history (admin only)
- `GET /api/v1/admin/dashboard-stats`: Get dashboard statistics (admin only)

## Frontend Components

### User Interface
- **Login Screen**: Authentication form
- **Dashboard**: Main user interface with attendance status and map
- **Attendance History**: Table of past attendance records
- **Map View**: Interactive map showing office locations and geofences

### Admin Interface
- **Dashboard**: Overview statistics and recent activity
- **Users Management**: Create, edit, and delete users
- **Offices Management**: Manage office locations and geofences
- **Activity Log**: Track user logins and attendance
- **Admin Management**: (Super admin only) Manage other admins

## Deployment

### Production Deployment Options

#### Option 1: Single Server Deployment

1. **Set up a VPS** (DigitalOcean, AWS EC2, etc.)
2. **Install dependencies**:
```bash
apt update && apt upgrade -y
apt install -y python3-pip python3-venv postgresql nginx certbot python3-certbot-nginx
```
3. **Configure Nginx** as a reverse proxy:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        root /var/www/attendance-tracker;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
4. **Set up SSL** with Certbot:
```bash
certbot --nginx -d yourdomain.com
```
5. **Create a systemd service** for the backend:
```ini
[Unit]
Description=Attendance Tracker API
After=network.target

[Service]
User=apiuser
WorkingDirectory=/path/to/backend
ExecStart=/path/to/poetry run uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

#### Option 2: Containerized Deployment (Docker)

1. **Create a Dockerfile for the backend**:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

RUN pip install poetry

COPY pyproject.toml poetry.lock* ./
RUN poetry config virtualenvs.create false && poetry install --no-dev

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. **Create a docker-compose.yml file**:
```yaml
version: '3'

services:
  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    env_file:
      - .env
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_DB=${POSTGRES_DB}
    
  backend:
    build: ./backend
    depends_on:
      - db
    env_file:
      - .env
    ports:
      - "8000:8000"
  
  frontend:
    image: nginx:alpine
    volumes:
      - ./frontend:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

3. **Run with Docker Compose**:
```bash
docker-compose up -d
```

## Troubleshooting

### Common Issues

#### Backend Issues
- **Database Connection Errors**: Check PostgreSQL credentials and connection settings
- **Migration Errors**: Ensure database is created before running migrations
- **Permission Errors**: Verify file permissions for the application directory
- **JWT Token Issues**: Check SECRET_KEY and token expiration settings

#### Frontend Issues
- **API Connection Issues**: Verify API_URL in config.js is correct
- **CORS Errors**: Ensure backend CORS settings include frontend domain
- **Geolocation Errors**: Browser may require HTTPS for geolocation API
- **Map Loading Issues**: Check if Leaflet.js CDN is accessible

#### User Management Issues
- **Admin Creation Failure**: Ensure super admin has proper privileges
- **User Login Problems**: Verify credentials and user active status
- **Password Reset**: Super admin can reset user passwords through admin panel

### Debugging Tips

1. **Backend Logs**: Check app logs for detailed error information
2. **API Documentation**: Review endpoints at `/docs` for correct usage
3. **Browser Console**: Check for JavaScript errors in browser developer tools
4. **Database Inspection**: Directly query database to verify data integrity

### Getting Help

If you encounter issues not covered in this documentation:
1. Check the issue tracker on GitHub
2. Submit a detailed bug report with steps to reproduce
3. For security issues, please contact the maintainers directly

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - The web framework used
- [Leaflet.js](https://leafletjs.com/) - Used for interactive maps
- [SQLAlchemy](https://www.sqlalchemy.org/) - Database ORM
- [JWT](https://jwt.io/) - Used for secure authentication