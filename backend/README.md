# ITPM Backend

A simple Node.js Express backend with MySQL database connection using MVC architecture.

## Prerequisites
- Node.js (v14 or higher)
- MySQL Server installed and running
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=itpm_db
DB_PORT=3306
PORT=5000
NODE_ENV=development
```

4. Create the database and initialize it:
```bash
npm run init-db
```

## Running the Server

### Development mode (with nodemon):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check endpoint

## Project Structure

```
backend/
├── config/
│   └── database.js              # MySQL connection pool configuration
├── scripts/
│   └── initDb.js                # Database initialization script
├── src/
│   ├── models/                  # Data models (.gitkeep)
│   ├── controllers/             # Request handlers (.gitkeep)
│   ├── services/                # Business logic (.gitkeep)
│   ├── utils/                   # Utility functions (.gitkeep)
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
├── tests/                       # Test files (.gitkeep)
├── members/                     # Team member workspaces
│   ├── PERERA/                  # PERERA's work folder
│   ├── SAMARAWICKRAMA/          # SAMARAWICKRAMA's work folder
│   ├── BANDARA/                 # BANDARA's work folder
│   └── DIAS/                    # DIAS's work folder
├── .env                         # Environment variables (local - not committed)
├── .env.example                 # Template for environment variables
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies
└── README.md                    # This file
```

## MVC Architecture

The project follows the MVC (Model-View-Controller) pattern:

- **Models** (`src/models/`) - Define data structures and database schema interactions
- **Controllers** (`src/controllers/`) - Handle HTTP requests and responses
- **Services** (`src/services/`) - Contain business logic and data manipulation
- **Utils** (`src/utils/`) - Helper functions and utilities

## Team Member Folders

Each team member has a dedicated folder under `members/` to organize their work:
- `members/PERERA/`
- `members/SAMARAWICKRAMA/`
- `members/BANDARA/`
- `members/DIAS/`

## Database Configuration

The database connection is configured in [backend/config/database.js](backend/config/database.js) and uses a connection pool for optimal performance.

The `.env` file contains all configuration settings and should include:
- `DB_HOST` - MySQL server hostname
- `DB_USER` - MySQL username
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name
- `DB_PORT` - MySQL port
- `PORT` - Express server port
- `NODE_ENV` - Environment (development/production)

## Notes

- The `.env` file contains sensitive information and should NEVER be committed to version control.
- Always copy `.env.example` to `.env` and fill in your credentials.
- Use `npm run init-db` to set up the database with required tables.

