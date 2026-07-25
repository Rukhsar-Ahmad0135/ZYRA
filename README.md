# ZYRA - Full Stack MERN E-Commerce Platform

## 📋 Project Overview

ZYRA is a full-stack e-commerce web application built with the MERN stack (MongoDB, Express.js, React, Node.js). It provides a complete shopping experience including product browsing, filtering, cart management, checkout, and an admin dashboard for managing users, products, and orders.

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.x | UI Framework |
| Vite | 8.x | Build Tool & Dev Server |
| Redux Toolkit | 2.12.x | State Management |
| React Router | 7.14.x | Routing |
| Axios | 1.18.x | HTTP Client |
| Tailwind CSS | 4.2.x | Styling |
| Sonner | 2.x | Toast Notifications |
| React Icons | 5.6.x | Icons |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | - | Runtime |
| Express | 5.2.x | Web Framework |
| MongoDB (Mongoose) | 9.x | Database & ODM |
| JSON Web Token (JWT) | 9.x | Authentication |
| bcryptjs | 3.x | Password Hashing |
| Cloudinary | 2.10.x | Image Cloud Storage |
| Multer | 2.x | File Upload Handling |
| Streamifier | 0.1.x | Stream Conversion |

---

## 🚀 Features

### User Features
- User Registration & Login
- Product Browsing with Search
- Product Filtering (Category, Gender, Color, Size, Material, Brand, Price)
- Product Sorting (Price Low/High, Newest)
- Product Detail View with Image Gallery
- Shopping Cart (Guest & Logged-in Users)
- Cart Persistence (LocalStorage)
- Cart Merge on Login (Guest to User)
- Checkout with Cash on Delivery
- Order Confirmation
- My Orders Page
- Newsletter Subscription
- New Arrivals & Best Sellers Sections

### Admin Features
- Admin Dashboard
- User Management (CRUD)
- Product Management (List, Edit, Delete)
- Order Management (Update Status, Delete)
- Admin Order Details View

---

## 🏗️ Project Structure

```
ZYRA/
├── package.json                 # Root: runs both FE & BE concurrently
├── README.md                    # This file
├── Backend/
│   ├── Server.js                # Express entry point
│   ├── seeder.js                # Database seeder (admin + products)
│   ├── config/db.js             # MongoDB connection
│   ├── data/products.js         # 40 seed products
│   ├── middleware/authMiddleware.js  # JWT protect + admin middleware
│   ├── models/
│   │   ├── Users.js, Product.js, Cart.js, checkout.js, order.js, Subscriber.js
│   └── routes/
│       ├── userRoutes.js, productRoutes.js, cartRoutes.js
│       ├── checkoutRoutes.js, orderRoute.js, uploadRoutes.js
│       ├── subscribeRoute.js, adminRoutes.js
│       ├── productAdminRoutes.js, adminOrderRoutes.js
├── Frontend/
│   ├── src/
│   │   ├── App.jsx              # Route definitions
│   │   ├── main.jsx             # React entry
│   │   ├── Pages/               # Page components
│   │   ├── components/          # Reusable components
│   │   └── redux/               # Redux store & slices
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** (local installation or MongoDB Atlas account)
- **Cloudinary** account (free tier works)

### Environment Setup

**Backend (`Backend/.env`):**
```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/zyra
JWT_SECRET=your_super_secret_jwt_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

**Frontend (`Frontend/.env`):**
```
VITE_BACKEND_URL=http://localhost:5000
```

### Installation

```bash
# 1. Install root dependencies
cd "f:/E Commerce project/ZYRA"
npm install

# 2. Install backend dependencies
cd Backend && npm install

# 3. Install frontend dependencies
cd ../Frontend && npm install

# 4. Go back to root
cd ..
```

### Database Seeding
```bash
cd Backend
npm run seed
```

This creates:
- **Admin User**: admin@example.com / 123456
- **40 Products**: Men's & Women's Top Wear & Bottom Wear

### Running

```bash
# From root directory - runs both servers
npm run dev

# OR separately:
# Terminal 1: cd Backend && npm run dev (port 5000)
# Terminal 2: cd Frontend && npm run dev (port 5173)
```

---

## 🔌 API Endpoints

### Public APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/users/register | Register new user |
| POST | /api/users/login | Login user |
| GET | /api/products | List/Search/Filter products |
| GET | /api/products/:id | Get product by ID |
| GET | /api/products/similar/:id | Get similar products |
| GET | /api/products/best-seller | Get best seller |
| GET | /api/products/new-arrivals | Get new arrivals |
| GET | /api/cart | Get cart (by userId or guestId) |
| POST | /api/cart | Add to cart |
| DELETE | /api/cart | Remove from cart |
| POST | /api/upload | Upload image to Cloudinary |
| POST | /api/subscribers | Subscribe to newsletter |

### Protected APIs (JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/profile | Get user profile |
| POST | /api/cart/merge | Merge guest cart into user cart |
| POST | /api/checkout | Create checkout session |
| PUT | /api/checkout/:id/pay | Mark checkout as paid |
| POST | /api/checkout/:id/finalize | Finalize checkout (creates order) |
| GET | /api/orders/my-orders | Get user's orders |
| GET | /api/orders/:id | Get order details |

### Admin APIs (JWT + Admin Role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/users | List all users |
| POST | /api/admin/users | Create user |
| PUT | /api/admin/users/:id | Update user |
| DELETE | /api/admin/users/:id | Delete user |
| GET | /api/admin/products | List all products |
| GET | /api/admin/orders | List all orders |
| PUT | /api/admin/orders/:id | Update order status |
| DELETE | /api/admin/orders/:id | Delete order |

---

## 📊 Security Audit Summary

| Category | Score | Status |
|----------|-------|--------|
| Overall Security | 45/100 | Critical improvements needed |
| Authentication | 55/100 | Partially implemented |
| Authorization | 40/100 | Broken in places |
| Backend Security | 30/100 | Many missing |
| Frontend Security | 35/100 | Token exposed in localStorage |
| Database Security | 60/100 | Decent but gaps |
| API Security | 40/100 | Missing validation |
| Deployment Readiness | 25/100 | Not ready |
| Performance | 50/100 | No pagination |
| E-commerce Features | 60/100 | Partial implementation |

### Key Security Gaps
- JWT token stored in localStorage (XSS vulnerable)
- No input validation on any backend endpoint
- No rate limiting (brute force attacks possible)
- No Helmet (security headers missing)
- CORS open to all origins
- No CSRF protection
- Product CRUD routes missing admin role check
- Upload route has no authentication
- No ownership validation on order details
- Weak password policy (minlength: 6 only)

---

## 🔑 Default Admin Credentials

| Field | Value |
|-------|-------|
| Email | admin@example.com |
| Password | 123456 |

---

## 📄 License

Copyright © - All Rights Reserved.

