# Backend Build Instructions

This document provides highly detailed instructions for an AI agent to completely rebuild the RestaurantSystem backend from scratch. The backend provides a RESTful API for a restaurant management system.

## 1. Project Overview & Tech Stack
*   **Runtime:** Node.js 20.x
*   **Language:** TypeScript (v5.3+)
*   **Web Framework:** Express (v4.18+)
*   **Database:** PostgreSQL 16
*   **Database Driver:** `pg` (v8.11+) (No ORM, raw queries or query builder is expected)
*   **Authentication:** JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`)
*   **Architecture:** Modular domain-driven design connected via a lightweight in-process event bus.

## 2. Project Structure
Create the following directory structure inside the `backend/` directory:

```text
backend/
├── src/
│   ├── app.ts                     # Application entry point, server setup
│   ├── infrastructure/            # Core cross-cutting concerns
│   │   ├── auth.ts                # JWT verification middleware, token signing
│   │   ├── db.ts                  # PostgreSQL connection pool setup
│   │   ├── eventBus.ts            # Simple Pub/Sub event bus implementation
│   │   └── initDb.ts              # Script to run SQL schemas/seeds
│   ├── modules/                   # Domain modules
│   │   ├── auth/                  # Login, user management
│   │   ├── order/                 # Menu, Orders creation
│   │   ├── kitchen/               # Kitchen tickets (KDS)
│   │   ├── table/                 # Table status management
│   │   ├── billing/               # Bills and payment
│   │   ├── inventory/             # Ingredient stock tracking
│   │   └── analytics/             # Revenue tracking
│   └── shared/
│       └── events.ts              # Event name constants and payload types
├── package.json
└── tsconfig.json
```
*(Each module in `src/modules/` should ideally have `index.ts`, `routes.ts`, `service.ts`, and `repository.ts`)*

## 3. Environment Variables
Create a `.env` file (and `.env.example`) with the following required variables. Replace placeholders with actual values during setup.

```env
# Database Configuration
DB_HOST=[db_host_ip_or_domain, e.g., localhost]
DB_PORT=[db_port, e.g., 5432]
DB_NAME=[database_name, e.g., RestaurantSystem]
DB_USER=[database_user, e.g., postgres]
DB_PASSWORD=[database_password]

# Authentication
JWT_SECRET=[your_secure_jwt_secret_key]
JWT_EXPIRES_IN=[token_expiry, e.g., 8h]

# Server
PORT=[server_port, e.g., 3000]
```

## 4. Database Schema
**CRITICAL:** Do not generate or migrate the database schema via code (no Prisma, no TypeORM migrations). The canonical database schema and seed data are stored in the file `db/RestaurantSystem.sql` at the root of the workspace.
The backend expects the following tables to exist:
*   `users`: ID (UUID), username, password, role, created_at
*   `menu_items`: ID (UUID), name, price, is_available
*   `dishes`: ID (UUID), name, category, cooking_method
*   `combo_dishes`: combo_id, dish_id
*   `ingredients`: ID (UUID), name, quantity, unit, threshold
*   `dish_ingredients`: dish_id, ingredient_name, qty_needed, unit
*   `tables`: ID (UUID), table_number, status (available/occupied/food_ready)
*   `orders`: ID (UUID), table_id, combo_id, combo_name, quantity, notes, total_price, status (pending/cooking/done)
*   `kitchen_tickets`: ID (UUID), order_id, table_id, combo_name, quantity, notes, status
*   `bills`: ID (UUID), order_id, table_id, total_amount, status (pending/paid)
*   `revenues`: ID (UUID), bill_id, amount, date

## 5. API Endpoints Specification
Base URL: `/api`.
All endpoints EXCEPT `/auth/login` and `/health` require an `Authorization: Bearer <JWT_TOKEN>` header.

### 5.1 Auth Module (`/api/auth`)
*   **POST `/auth/login`**
    *   **Req:** `{ "username": "admin", "password": "pwd" }`
    *   **Res (200):** `{ "token": "jwt..." }`
    *   **Res (401):** `{ "error": "Invalid credentials" }`

### 5.2 Order Module (`/api/menu` & `/api/orders`)
*   **GET `/menu`** (All roles)
    *   **Res:** `[{ "id": "uuid", "name": "Combo A", "price": 1000, "isAvailable": true }]`
*   **PATCH `/menu/:id/availability`** (Roles: admin, manager)
    *   **Req:** `{ "isAvailable": false }`
    *   **Res:** `{ "ok": true }`
*   **POST `/orders`** (Roles: server, manager, admin) -> **Publishes `ORDER_CREATED`**
    *   **Req:** `{ "tableId": "001", "comboId": "uuid", "quantity": 2, "notes": "No spicy" }`
    *   **Res (201):** `{ "id": "uuid", "tableId": "001", ... "status": "pending" }`
*   **GET `/orders/table/:tableId`** (Roles: server, cashier, manager, admin)
    *   **Res:** Array of order objects.

### 5.3 Kitchen Module (`/api/kitchen`)
*   **GET `/kitchen/tickets`** (Roles: chef, manager, admin)
    *   **Res:** Array of tickets (pending/cooking).
*   **PATCH `/kitchen/:id/start`** (Roles: chef, manager, admin)
    *   **Action:** Update ticket status to `cooking`.
*   **PATCH `/kitchen/:id/done`** (Roles: chef, manager, admin) -> **Publishes `ORDER_COMPLETED`**
    *   **Action:** Update ticket status to `done`.

### 5.4 Table Module (`/api/tables`)
*   **GET `/tables`** (Roles: server, manager, admin, cashier)
    *   **Res:** `[{ "id": "uuid", "tableNumber": "001", "status": "available|occupied|food_ready" }]`

### 5.5 Billing Module (`/api/billing`)
*   **GET `/billing/:tableId`** (Roles: cashier, manager, admin)
    *   **Res (200):** `{ "id": "uuid", "totalAmount": 1000, "status": "pending" }`
    *   **Res (404):** If no pending bill.
*   **POST `/billing/:billId/pay`** (Roles: cashier, manager, admin) -> **Publishes `PAYMENT_COMPLETED`**
    *   **Action:** Mark bill as paid.

### 5.6 Inventory Module (`/api/inventory`)
*   **GET `/inventory`** (Roles: manager, admin)
    *   **Res:** `[{ "id": "uuid", "name": "Chicken", "quantity": 50, "unit": "kg", "threshold": 10 }]`
*   **PATCH `/inventory/:name`** (Roles: manager, admin)
    *   **Req:** `{ "quantity": 100 }`

### 5.7 Analytics Module (`/api/analytics`)
*   **GET `/analytics/revenue?date=YYYY-MM-DD`** (Roles: manager, admin)
    *   **Res:** `{ "date": "2024-01-01", "total": 1500000 }`
*   **POST `/analytics/users`** (Roles: admin)
    *   **Req:** `{ "username": "user", "password": "pwd", "role": "server" }`
*   **GET `/analytics/users`** (Roles: admin)
    *   **Res:** Array of users (excluding passwords).

### 5.8 Health
*   **GET `/health`**
    *   **Res (200):** `{ "status": "ok", "db": "connected" }`

## 6. Step-by-Step Implementation Sequence

**Step 1: Project Setup**
1. Initialize package.json (`npm init -y`).
2. Install dependencies: `express`, `pg`, `cors`, `jsonwebtoken`, `bcryptjs`.
3. Install devDependencies: `typescript`, `ts-node-dev`, `@types/...`.
4. Configure `tsconfig.json` for Node 20.

**Step 2: Core Infrastructure Setup**
1. Create `infrastructure/db.ts` to export a `pg` Pool instance using `.env` variables.
2. Create `infrastructure/auth.ts` containing the JWT verification middleware and role-based authorization middleware.
3. Create `infrastructure/eventBus.ts` implementing a simple EventEmitter or custom Pub/Sub class.
4. Define event constants and payload types in `shared/events.ts`. Events: `ORDER_CREATED`, `ORDER_COMPLETED`, `PAYMENT_COMPLETED`, `RAW_MATERIAL_LOW`.

**Step 3: Implement Auth Module**
1. Build `modules/auth/repository.ts` to fetch users by username.
2. Build `modules/auth/service.ts` to compare bcrypt passwords and generate JWTs.
3. Build `modules/auth/routes.ts` exposing `/api/auth/login`.

**Step 4: Implement Event-Driven Domain Modules**
*Note: Subscribers must be registered to the EventBus BEFORE publishers emit events during app initialization.*

1.  **Kitchen Module**:
    *   **Subscribes to:** `ORDER_CREATED` (Action: Create a kitchen_ticket).
    *   **Endpoints:** GET tickets, PATCH start, PATCH done.
    *   **Publishes:** `ORDER_COMPLETED` (when ticket is marked done).
2.  **Table Module**:
    *   **Subscribes to:** `ORDER_CREATED` (status -> occupied), `ORDER_COMPLETED` (status -> food_ready), `PAYMENT_COMPLETED` (status -> available).
    *   **Endpoints:** GET all tables.
3.  **Billing Module**:
    *   **Subscribes to:** `ORDER_COMPLETED` (Action: Create a bill for the order).
    *   **Endpoints:** GET bill by table, POST pay bill.
    *   **Publishes:** `PAYMENT_COMPLETED` (when bill is paid).
4.  **Inventory Module**:
    *   **Subscribes to:** `ORDER_CREATED` (Action: Deduct ingredients used in the combo).
    *   **Publishes:** `RAW_MATERIAL_LOW` (if inventory drops below threshold after deduction).
    *   **Endpoints:** GET inventory, PATCH inventory.
5.  **Analytics Module**:
    *   **Subscribes to:** `PAYMENT_COMPLETED` (Action: Record revenue).
    *   **Endpoints:** GET revenue, POST/GET users.
6.  **Order Module**:
    *   **Subscribes to:** `RAW_MATERIAL_LOW` (Action: Automatically set menu combo to unavailable).
    *   **Subscribes to:** `ORDER_COMPLETED` (Action: Update order status to done).
    *   **Endpoints:** GET menu, PATCH menu availability, POST create order.
    *   **Publishes:** `ORDER_CREATED` (when an order is created).

**Step 5: Wiring it all together in `app.ts`**
1. Initialize Express app.
2. Add global middlewares: `cors()`, `express.json()`.
3. Initialize the database connection.
4. Instantiate the EventBus.
5. **CRITICAL ORDERING:** Initialize and register modules in the correct order so subscribers attach before publishers can emit.
    *   Auth -> Kitchen -> Table -> Billing -> Inventory -> Analytics -> Order.
6. Mount routes onto `/api/...`.
7. Add global error handler.
8. Start listening on `process.env.PORT`.
