# Issue Tracker API

A RESTful Issue Tracker API built with **Node.js**, **Express.js**, **TypeScript**, and **PostgreSQL**. The application supports user authentication, role-based authorization, and complete issue management for contributors and maintainers.

## Features

### Authentication

* User registration (Signup)
* User login with JWT authentication
* Password hashing using bcrypt
* Protected routes

### Authorization

* Role-based access control
* Two roles:

  * **Maintainer**
  * **Contributor**

### Issue Management

* Create Issue
* Get All Issues
* Get Single Issue
* Update Issue
* Delete Issue
* Filter issues by status
* Filter issues by type
* Sort issues by newest or oldest

### User Management

* Create User
* Get All Users
* Get Single User
* Update User
* Delete User

### Other Features

* Global Error Handling
* Request Logging Middleware
* PostgreSQL Database Integration
* Clean Project Structure
* TypeScript Support

---

# Technologies Used

* Node.js
* Express.js
* TypeScript
* PostgreSQL
* pg
* bcryptjs
* jsonwebtoken (JWT)
* dotenv
* cors
* http-status-codes

---


# Database Setup

used neonDB .

# API Endpoints

## Authentication

### Register User

```
POST /api/auth/signup
```

### Login

```
POST /api/auth/login
```

---

## Users

### Create User

```
POST /api/users
```

### Get All Users

```
GET /api/users
```

### Get Single User

```
GET /api/users/:id
```

### Update User

```
PUT /api/users/:id
```

### Delete User

```
DELETE /api/users/:id
```

---

## Issues

### Create Issue

```
POST /api/issues
```

### Get All Issues

```
GET /api/issues
```

Supports:

```
GET /api/issues?status=open
GET /api/issues?type=bug
GET /api/issues?sort=oldest
```

### Get Single Issue

```
GET /api/issues/:id
```

### Update Issue

```
PATCH /api/issues/:id
```

### Delete Issue

```
DELETE /api/issues/:id
```

---

# Authentication

Protected routes require a JWT.

Send the token using the `Authorization` header.

Example:

```
Authorization: <your_jwt_token>
```

---

# Roles

### Maintainer

* View users
* Create issues
* Update any issue
* Delete any issue

### Contributor

* Create issues
* View issues
* Update only their own open issues
* Cannot delete issues

---


# Author

**Rafsan Jahin Rad**

---
# License

This project was developed as part of an academic assignment.
