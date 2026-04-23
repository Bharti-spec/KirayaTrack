# KirayaTrack with Custom DataVault Backend

This is KirayaTrack with a custom backend server that replaces Supabase with your own DataVault implementation.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open `index.html` in your browser

## Features

- **Custom DataVault Client**: Mimics Supabase API but runs on your local server
- **File-based Storage**: Data is stored in `database.json` file
- **Same API**: All existing frontend code works without changes
- **CORS Enabled**: Allows frontend to communicate with backend

## API Endpoints

The server provides REST endpoints that match Supabase's query interface:

- `GET /api/:table` - Query data with filters
- `POST /api/:table` - Insert new records
- `PATCH /api/:table` - Update existing records
- `DELETE /api/:table` - Delete records

## Data Storage

Data is stored in a `database.json` file in the project root. The server automatically loads and saves data to this file.

## Tables Supported

- `landlords` - Landlord accounts
- `tenants` - Tenant information
- `buildings` - Building details
- `rooms` - Room information
- `payments` - Payment records
- `bills` - Bill records

## Future Improvements

- Replace file-based storage with a real database (SQLite, PostgreSQL, etc.)
- Add authentication and authorization
- Add data validation
- Add backup/restore functionality