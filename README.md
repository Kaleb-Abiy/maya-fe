# Maya Inventory Frontend

A simple Vue.js 3 frontend for the Maya Inventory Management System.

## Features

- Client management
- Daily inventory tracking (eggs)
- Issue/invoice management
- Payment tracking
- Delivery scheduling
- Stock balance tracking

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

- `src/App.vue` - Main app component with navigation
- `src/router/` - Vue Router configuration
- `src/views/` - Page components
- `src/services/` - API service utilities
- `src/style.css` - Global styles

## API Integration

The frontend expects the backend API to be running on `http://localhost:8000`. The API endpoints should follow this structure:

- `GET /api/v1/clients` - List clients
- `POST /api/v1/clients` - Create client
- `PUT /api/v1/clients/:id` - Update client
- `DELETE /api/v1/clients/:id` - Delete client

Similar endpoints for:
- `/inventory` - Daily inventory
- `/issues` - Issues/invoices
- `/payments` - Payments
- `/deliveries` - Delivery schedule
- `/stock-balance` - Stock balance

