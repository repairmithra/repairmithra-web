# RepairMithra Security Architecture Audit

## 1. Application Architecture

### Overview
RepairMithra is a full-stack web application with a React/Vite frontend and an Express + MongoDB backend. The stack is split between a client application for booking and account flows, and a REST API that manages authentication, bookings, service discovery, payment order creation, and verification.

### Repository structure
- Root workspace includes frontend and backend packages, plus shared root package metadata.
- Frontend runtime: React 19 + Vite + Tailwind CSS.
- Backend runtime: Node.js + Express 5 + MongoDB via Mongoose.
- Primary entry points:
  - Frontend: [frontend/src/main.jsx](../frontend/src/main.jsx)
  - Frontend app shell: [frontend/src/App.jsx](../frontend/src/App.jsx)
  - Backend app: [backend/src/app.js](../backend/src/app.js)
  - Backend server startup: [backend/src/server.js](../backend/src/server.js)
  - MongoDB connection: [backend/src/config/db.js](../backend/src/config/db.js)

### Frontend architecture
- App shell renders a BrowserRouter and top-level services context.
- Routing implemented using react-router-dom.
- Primary pages include home, login, register, profile, service listing/detail, booking flow, payment, and status pages.
- Forms are implemented directly in page components and use local component state plus fetch calls to the backend.
- Shared client auth/session state is handled in [frontend/src/utils/auth.js](../frontend/src/utils/auth.js).
- Shared API wrapper is in [frontend/src/utils/api.js](../frontend/src/utils/api.js).
- Service data is loaded through a provider pattern in [frontend/src/context/ServicesProvider.jsx](../frontend/src/context/ServicesProvider.jsx) and [frontend/src/hooks/useServices.js](../frontend/src/hooks/useServices.js).

### Backend architecture
- Express app is assembled in [backend/src/app.js](../backend/src/app.js).
- Security middleware includes CORS, Helmet, morgan logging, JSON/body parsing, and cookie parsing.
- Route mounting is centralized in the app, with endpoint groups for auth, services, bookings, technicians, and payments.
- Controllers handle business logic and DB interactions.
- Models define MongoDB schemas and validation rules.
- Utility modules handle JWT creation, scheduling, payment flow helpers, and validators.

---

## 2. Frontend Attack Surface

### Frontend entry points
- [frontend/src/main.jsx](../frontend/src/main.jsx)
- [frontend/src/App.jsx](../frontend/src/App.jsx)

### Routing surface
Routes defined in [frontend/src/App.jsx](../frontend/src/App.jsx):
- /
- /login
- /register
- /profile
- /services
- /services/:slug
- /services/:slug/book
- /services/:slug/payment
- /booking/:bookingId/confirmation
- /booking/:bookingId

### Forms and user input surfaces
- Registration form: [frontend/src/pages/register/Registration.jsx](../frontend/src/pages/register/Registration.jsx)
- Login form: [frontend/src/pages/login/Login.jsx](../frontend/src/pages/login/Login.jsx)
- Booking form: [frontend/src/pages/services/BookService.jsx](../frontend/src/pages/services/BookService.jsx)
- Payment form: [frontend/src/pages/services/Payment.jsx](../frontend/src/pages/services/Payment.jsx)
- Profile editing modal: [frontend/src/pages/profile/components/EditProfileModal.jsx](../frontend/src/pages/profile/components/EditProfileModal.jsx)

### API calls and client-side state
- API wrapper: [frontend/src/utils/api.js](../frontend/src/utils/api.js)
- Session/auth storage: [frontend/src/utils/auth.js](../frontend/src/utils/auth.js)
- Razorpay integration helper: [frontend/src/utils/payment.js](../frontend/src/utils/payment.js)
- Geolocation helper: [frontend/src/utils/geocode.js](../frontend/src/utils/geocode.js)

### Local persistence and client trust boundaries
- JWT token and profile user data are stored in localStorage via [frontend/src/utils/auth.js](../frontend/src/utils/auth.js).
- The frontend attaches Authorization headers using the stored token on authenticated requests.
- Frontend route guards rely on client-side login state, not server-side role enforcement.

---

## 3. Backend Attack Surface

### Backend entry point
- [backend/src/server.js](../backend/src/server.js)
- [backend/src/app.js](../backend/src/app.js)

### Middleware
- Global CORS: [backend/src/app.js](../backend/src/app.js)
- Helmet security headers: [backend/src/app.js](../backend/src/app.js)
- JSON body parsing: [backend/src/app.js](../backend/src/app.js)
- Cookie parsing: [backend/src/app.js](../backend/src/app.js)
- Request logging: [backend/src/app.js](../backend/src/app.js)
- Auth enforcement: [backend/src/middleware/authMiddleware.js](../backend/src/middleware/authMiddleware.js)
- Rate limiting on email verification endpoints: [backend/src/routes/authRoutes.js](../backend/src/routes/authRoutes.js)

### Controllers
- Authentication and OTP: [backend/src/controllers/authController.js](../backend/src/controllers/authController.js)
- Bookings: [backend/src/controllers/bookingController.js](../backend/src/controllers/bookingController.js)
- Services: [backend/src/controllers/serviceController.js](../backend/src/controllers/serviceController.js)
- Payments: [backend/src/controllers/paymentController.js](../backend/src/controllers/paymentController.js)
- Technicians: [backend/src/controllers/technicianController.js](../backend/src/controllers/technicianController.js)

### Services and utility layers
- Email service: [backend/src/services/emailService.js](../backend/src/services/emailService.js)
- Token generation: [backend/src/utils/generateToken.js](../backend/src/utils/generateToken.js)
- Payment helper module: [backend/src/utils/payment.js](../backend/src/utils/payment.js)
- Scheduling utilities: [backend/src/utils/schedule.js](../backend/src/utils/schedule.js)
- Validators: [backend/src/utils/validators.js](../backend/src/utils/validators.js)

### Routes
- Auth: [backend/src/routes/authRoutes.js](../backend/src/routes/authRoutes.js)
- Services: [backend/src/routes/serviceRoutes.js](../backend/src/routes/serviceRoutes.js)
- Bookings: [backend/src/routes/bookingRoutes.js](../backend/src/routes/bookingRoutes.js)
- Technician lookup: [backend/src/routes/technicianRoutes.js](../backend/src/routes/technicianRoutes.js)
- Payments: [backend/src/routes/paymentRoutes.js](../backend/src/routes/paymentRoutes.js)

---

## 4. API Attack Surface

### Endpoint inventory

#### Auth
- POST /api/auth/send-verification-code
  - Source: [backend/src/routes/authRoutes.js](../backend/src/routes/authRoutes.js)
  - Controller: [backend/src/controllers/authController.js](../backend/src/controllers/authController.js)
  - Auth: No
  - Input: email
  - DB: User lookup, EmailVerification lookup/create/update
  - External: Resend API email send

- POST /api/auth/verify-verification-code
  - Auth: No
  - Input: email, verificationCode
  - DB: EmailVerification lookup and attempts tracking
  - External: None

- POST /api/auth/register
  - Auth: No
  - Input: fullName, email, verificationCode, phone, address, pincode, password
  - DB: User creation, EmailVerification check, delete OTP after success
  - External: None

- POST /api/auth/login
  - Auth: No
  - Input: email, password
  - DB: User lookup, bcrypt password compare
  - External: None

- GET /api/auth/profile
  - Auth: Yes, via JWT middleware
  - Authorization: current authenticated user only
  - DB: User lookup by authenticated user id

#### Services
- GET /api/services
  - Auth: No
  - DB: Service.find({ isActive: true })

- GET /api/services/:slug
  - Auth: No
  - DB: Service lookup by slug

#### Bookings
- POST /api/bookings
  - Auth: Yes
  - Authorization: customer identity bound to booking creation via req.user._id
  - Input: serviceId, address, city, pincode, latitude, longitude, bookingDate, timeSlot, notes
  - DB: service validation, booking creation, geospatial location save

- GET /api/bookings
  - Auth: Yes
  - Authorization: current user only
  - DB: Booking.find({ customer: req.user._id })

- GET /api/bookings/:id
  - Auth: Yes
  - Authorization: current user only via Booking.findOne({ _id, customer: req.user._id })

#### Payments
- POST /api/payments/create-order
  - Auth: Yes
  - Authorization: customer must own the booking
  - Input: bookingId
  - DB: Booking ownership check, Payment lookup/create, Service visitFee validation
  - External: Razorpay order creation

- POST /api/payments/verify
  - Auth: Yes
  - Authorization: customer must own the payment record and booking
  - Input: razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId
  - DB: Payment record update, Booking paymentStatus update
  - External: Razorpay signature comparison

#### Technicians
- GET /api/technicians/nearby
  - Auth: Yes
  - Query input: serviceId, latitude, longitude, bookingDate, timeSlot
  - DB: geospatial technician search near coordinates, exclude booked techs

### Input/validation notes
- Several endpoints implement server-side validation on string length, numeric format, and ObjectId checks.
- However, the audit target is architecture and attack surface mapping; no compliance claim is made.

---

## 5. Authentication Flow

### Registration
- Frontend sends email verification request first.
- Backend validates email, checks for existing user, and sends an OTP using Resend.
- OTP is hashed with SHA-256 before storage.
- Registration requires valid email verification and password rules.
- Password is hashed with bcrypt 10 rounds before saving.
- New users are assigned default role "customer".

### Login
- Frontend calls POST /api/auth/login with email and password.
- Backend looks up the user by email and compares the submitted password using bcrypt.compare().
- JWT is generated via [backend/src/utils/generateToken.js](../backend/src/utils/generateToken.js) with user ID and role as payload.
- Token expiry is 7 days.

### JWT/session handling
- JWT secret is supplied through process.env.JWT_SECRET.
- Token transport is Authorization: Bearer <token> from the frontend.
- Session is stored in localStorage in the browser: [frontend/src/utils/auth.js](../frontend/src/utils/auth.js).
- Authentication middleware checks bearer token and user existence in MongoDB: [backend/src/middleware/authMiddleware.js](../backend/src/middleware/authMiddleware.js).

### OTP and email verification
- Model: [backend/src/models/EmailVerification.js](../backend/src/models/EmailVerification.js)
- Lifetime is set via expiry timestamp; Mongo TTL index auto-expires old records.
- Attempts are tracked against a maximum threshold.

### Password reset
- No password reset endpoint or flow was identified in the repository.
- The login page references a forgot-password route, but no corresponding backend route or implementation was found.

### Logout
- No dedicated backend logout route was found.
- Client-side logout behavior appears to clear localStorage tokens via [frontend/src/utils/auth.js](../frontend/src/utils/auth.js).

---

## 6. Authorization Model

### Roles defined
User roles are defined in [backend/src/models/User.js](../backend/src/models/User.js):
- customer
- technician
- admin

### Role enforcement
- JWT payload includes user role.
- The auth middleware validates the token and loads the user object, then sets req.user.
- There does not appear to be a central role-based authorization middleware or reusable admin-only guard.
- Authorization is primarily enforced by query filters that scope resource access to req.user._id.
- Examples:
  - Booking ownership checks: [backend/src/controllers/bookingController.js](../backend/src/controllers/bookingController.js)
  - Payment ownership checks: [backend/src/controllers/paymentController.js](../backend/src/controllers/paymentController.js)

### Risk review areas
- Role-based restrictions are not obviously enforced on all sensitive operations.
- There is no clear admin-only permission layer for administrative resources.
- The client stores JWT and user details in localStorage; a malicious script or browser compromise could expose them.
- Potential access-control review area: any endpoint that trusts req.user without further scope checks should be audited.

---

## 7. Database Access

### MongoDB connection
- [backend/src/config/db.js](../backend/src/config/db.js)
- Connection string is read from process.env.MONGODB_URI.
- Database access is through Mongoose models.

### Models / schemas
- [backend/src/models/User.js](../backend/src/models/User.js)
- [backend/src/models/Booking.js](../backend/src/models/Booking.js)
- [backend/src/models/Payment.js](../backend/src/models/Payment.js)
- [backend/src/models/Service.js](../backend/src/models/Service.js)
- [backend/src/models/Technician.js](../backend/src/models/Technician.js)
- [backend/src/models/EmailVerification.js](../backend/src/models/EmailVerification.js)

### Database queries in use
- User lookup by email and phone for registrations.
- Booking creation with service verification and geospatial location persistence.
- Payment lookup by booking/customer/
- Technician search via geospatial $near queries.
- User profile fetch by authenticated user ID.

### User-controlled inputs entering the database
- Registration: name, email, phone, address, pincode, password.
- Booking: address, city, pincode, coordinates, notes, date, timeslot.
- Payment: bookingId and gateway fields from Razorpay response.
- Technician lookup: latitude, longitude, bookingDate, timeSlot query parameters.

### Data validation observed
- Input pattern checks exist for email, phone, pincode, and date formats.
- Length checks exist for address and other strings.
- GeoJSON coordinates and ranges are validated in booking and technician queries.

---

## 8. Payment Flow

### Razorpay integration
- Client helper: [frontend/src/utils/payment.js](../frontend/src/utils/payment.js)
- Backend order creation: [backend/src/controllers/paymentController.js](../backend/src/controllers/paymentController.js)
- Backend route: [backend/src/routes/paymentRoutes.js](../backend/src/routes/paymentRoutes.js)

### Order creation flow
1. Frontend calls POST /api/payments/create-order with auth token and bookingId.
2. Backend verifies the booking belongs to the current customer and is in pending_payment status.
3. Backend reads the service's visitFee from MongoDB.
4. Backend asks Razorpay to create an order using key_id and key_secret from environment variables.
5. Payment record is created or updated in MongoDB with gatewayOrderId.

### Payment verification flow
1. Razorpay checkout returns razorpay_order_id, razorpay_payment_id, and razorpay_signature.
2. Frontend sends those values to POST /api/payments/verify.
3. Backend looks up the payment record for the booking and customer.
4. Backend recomputes the HMAC signature using Razorpay key secret.
5. If valid, it updates payment status to paid and marks the booking paid + confirmed.

### Trust boundaries and replay risks
- The payment verification is based on the Razorpay signature value returned to the client.
- Backend does not show a webhook listener or external callback verification flow in the reviewed code.
- There is no explicit duplicate payment/replay guard beyond Payment.findOne({ booking, ...}) and status checks.
- The audit should review whether idempotency controls are sufficient for repeated verification requests or double-click behavior.

### Amount validation
- Amount is derived server-side from the booking service's visitFee before creating Razorpay order.
- The frontend uses the service price to display the payment amount, but the server is the source of truth for the actual amount in the Razorpay order.

---

## 9. Email Flow

### Resend integration
- Backend email client: [backend/src/services/emailService.js](../backend/src/services/emailService.js)
- Email verification flow: [backend/src/controllers/authController.js](../backend/src/controllers/authController.js)
- Resend API usage in verification route: fetch("https://api.resend.com/emails") with Authorization: Bearer ${process.env.RESEND_API_KEY}

### Email types observed
- Email verification OTP during registration.
- Email content includes a 6-digit OTP and expiry message.

### Environment variables relevant to email
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- EMAIL_FROM

### Mail sending considerations
- The API key and sender address are loaded from environment variables and not hardcoded in source.
- No dedicated email validation or abuse detection beyond OTP rate limiting was identified.

---

## 10. File Upload Flow

### File upload status
- No upload endpoints or file handling libraries (e.g., multer) were identified.
- No file storage configuration or uploaded asset directory was found.
- No file upload access control layer appears to exist in the reviewed code.

### Result
No file upload attack surface was identified in the scanned codebase.

---

## 11. Deployment Architecture

### Observed deployment surface
- No .env files were found in the repository search.
- No GitHub Actions workflow files were found under .github.
- No Dockerfile or docker-compose manifest was found.
- No Netlify, Render, or Hostinger configuration files were found in the workspace.

### Current code is configured for local development and likely remote deployment via host-managed environment variables.

---

## 12. Security-Sensitive Files

### Important files to review in the audit
- [backend/src/app.js](../backend/src/app.js)
- [backend/src/server.js](../backend/src/server.js)
- [backend/src/middleware/authMiddleware.js](../backend/src/middleware/authMiddleware.js)
- [backend/src/controllers/authController.js](../backend/src/controllers/authController.js)
- [backend/src/controllers/bookingController.js](../backend/src/controllers/bookingController.js)
- [backend/src/controllers/paymentController.js](../backend/src/controllers/paymentController.js)
- [backend/src/models/User.js](../backend/src/models/User.js)
- [backend/src/models/Booking.js](../backend/src/models/Booking.js)
- [backend/src/models/Payment.js](../backend/src/models/Payment.js)
- [backend/src/models/EmailVerification.js](../backend/src/models/EmailVerification.js)
- [frontend/src/utils/auth.js](../frontend/src/utils/auth.js)
- [frontend/src/utils/api.js](../frontend/src/utils/api.js)
- [frontend/src/utils/payment.js](../frontend/src/utils/payment.js)
- [backend/src/config/db.js](../backend/src/config/db.js)
- [backend/src/routes/authRoutes.js](../backend/src/routes/authRoutes.js)

---

## 13. Environment Variables / Secrets Locations

### Variables referenced by code
- MONGODB_URI — MongoDB connection string in [backend/src/config/db.js](../backend/src/config/db.js)
- JWT_SECRET — JWT signing secret in [backend/src/utils/generateToken.js](../backend/src/utils/generateToken.js) and [backend/src/middleware/authMiddleware.js](../backend/src/middleware/authMiddleware.js)
- RAZORPAY_KEY_ID — Razorpay publishable key in [backend/src/controllers/paymentController.js](../backend/src/controllers/paymentController.js)
- RAZORPAY_KEY_SECRET — Razorpay secret key in [backend/src/controllers/paymentController.js](../backend/src/controllers/paymentController.js)
- RESEND_API_KEY — email sending credential in [backend/src/controllers/authController.js](../backend/src/controllers/authController.js) and [backend/src/services/emailService.js](../backend/src/services/emailService.js)
- RESEND_FROM_EMAIL — email sender identity in [backend/src/controllers/authController.js](../backend/src/controllers/authController.js)
- EMAIL_FROM — email sender identity in [backend/src/services/emailService.js](../backend/src/services/emailService.js)
- PORT — backend startup port in [backend/src/server.js](../backend/src/server.js)
- VITE_API_URL — frontend API base, if used in production deployment in [frontend/src/utils/api.js](../frontend/src/utils/api.js)

### Important note
No actual secret values were observed or reproduced in this review. The document intentionally reports only variable names and file locations, not the values themselves.

---

## 14. Dependency Overview

### Backend dependencies
Package manifest: [backend/package.json](../backend/package.json)
- express
- mongoose
- cors
- helmet
- morgan
- dotenv
- bcrypt / bcryptjs
- jsonwebtoken
- express-rate-limit
- express-validator
- razorpay
- resend
- cookie-parser
- nodemon (dev)

### Frontend dependencies
Package manifest: [frontend/package.json](../frontend/package.json)
- react
- react-dom
- react-router-dom
- tailwindcss
- @tailwindcss/vite
- framer-motion
- react-icons
- vite
- @vitejs/plugin-react
- oxlint

### Lock files
- [backend/package-lock.json](../backend/package-lock.json)
- [frontend/package-lock.json](../frontend/package-lock.json)
- [package-lock.json](../package-lock.json)

### Security-sensitive dependency notes
- The backend includes email and payment SDKs (Resend and Razorpay), which should be reviewed for API usage patterns and rotation practices.
- Rate limiting, Helmet, and bcrypt are present, which is positive for baseline security hardening.
- No dependency audit output or explicit security policy document was found in the repo.

---

## 15. Existing Security Controls

### Observed controls
- Helmet is enabled in [backend/src/app.js](../backend/src/app.js)
- CORS is enabled in [backend/src/app.js](../backend/src/app.js)
- rateLimit is configured for email verification requests in [backend/src/routes/authRoutes.js](../backend/src/routes/authRoutes.js)
- BCrypt hashing is used for passwords in [backend/src/controllers/authController.js](../backend/src/controllers/authController.js)
- JWT is used for session authentication in [backend/src/utils/generateToken.js](../backend/src/utils/generateToken.js)
- MongoDB TTL index is used for OTP expiry in [backend/src/models/EmailVerification.js](../backend/src/models/EmailVerification.js)
- Mongoose schema validation exists for user, booking, and service data
- Request body verification and length checks exist in several controllers

### Gaps and limitations
- No explicit CSRF protection is implemented for cookie-based flows because the app is token-based with Authorization headers.
- No secure cookie usage was identified for session storage.
- No centralized RBAC middleware was found.
- No explicit helmet policy customization beyond default Helmet settings.
- No server-side rate limiting beyond email verification endpoints was identified.

---

## 16. Potential Security Risk Areas

### High-priority review areas
1. LocalStorage JWT storage
   - Risk: token exposure through XSS or browser compromise.
   - Evidence: [frontend/src/utils/auth.js](../frontend/src/utils/auth.js)

2. Missing explicit authorization layer
   - Risk: unauthorized access if future routes are added or controller checks are incomplete.
   - Evidence: auth middleware only validates token and user existence.

3. Payment verification trust boundary
   - Risk: replay or tampering if verification flow is not hardened against duplicate requests or out-of-order state transitions.
   - Evidence: [backend/src/controllers/paymentController.js](../backend/src/controllers/paymentController.js)

4. Email OTP handling
   - Risk: user enumeration and brute-force attempts; needs deeper review of OTP lifecycle and rate limiting.
   - Evidence: [backend/src/controllers/authController.js](../backend/src/controllers/authController.js)

5. Lack of admin or role-specific guard rails
   - Risk: privilege escalation and missing role checks.
   - Evidence: [backend/src/models/User.js](../backend/src/models/User.js)

6. No clear logout or token revocation flow
   - Risk: session persistence and stale tokens remain valid until expiry.
   - Evidence: frontend clears local state, but no server-side revocation is visible.

7. No explicit anti-abuse strategy for user input or public APIs
   - Risk: enumeration, brute force, or excessive request traffic.
   - Evidence: limited rate limit surface and no broader throttling strategy.

---

## 17. OWASP Top 10:2025 Attack Surface Mapping

### A01 Broken Access Control
- Booking and payment access is mostly scoped to req.user._id, but the app should be reviewed for missing checks on all sensitive routes and future endpoints.
- No clear admin or technician authorization layer was identified.

### A02 Security Misconfiguration
- No explicit deployment config files or environment templates were found in repo.
- Helmet is enabled but policies are not documented or customized.
- No explicit HTTPS-only or secure transport enforcement was visible in app code.

### A03 Software Supply Chain Failures
- Dependency versions are present in package manifests, but no SBOM, lockfile review policy, or vulnerability-monitoring process was identified.
- Third-party services (Razorpay, Resend) require additional secret/misuse review.

### A04 Cryptographic Failures
- bcrypt is used for password hashing, which is good baseline practice.
- JWT signing uses a secret, but no secret rotation or key-management process was found in repo.
- OTP hashes are stored, which is a good practice, but strength and lifecycle need review.

### A05 Injection
- No SQL injection vector was identified because MongoDB queries are done through Mongoose models.
- User-controlled data is used in queries and HTML email templates; input sanitization should be reviewed.

### A06 Insecure Design
- The app includes customer booking and payment workflows, but there is no visible explicit authorization model for admin/technician operations.
- Payment status transitions and duplicate verification paths should be reviewed as design-level concerns.

### A07 Authentication Failures
- JWT is stored in localStorage and used client-side.
- No password reset flow is implemented in the reviewed code.
- Registration and login are present, but the app should be reviewed for brute-force protections beyond OTP email rate limiting.

### A08 Software or Data Integrity Failures
- Payment verification depends on signature matching, but no server-side idempotency or replay protections beyond status checks were apparent.
- Booking and payment updates rely on user-supplied IDs in request bodies; server-side ownership checks are present, but broader integrity checks should be reviewed.

### A09 Security Logging & Alerting Failures
- Logging exists via morgan and console.error in many places, but there is no clear centralized audit log for auth failures, payment anomalies, or admin actions.

### A10 Mishandling of Exceptional Conditions
- Catch blocks return generic failure messages, but stack traces and raw errors are logged to console in several controllers.
- The app should be reviewed for sensitive error exposure and debug information retention in production.

---

## 18. Proposed Security Audit Plan

### Phase 1: Architecture and data flow review
- Confirm all API routes and auth flows.
- Review ownership checks and role enforcement on every route.
- Map all database writes and user-controlled fields.

### Phase 2: Authentication and token security
- Review JWT issuance, expiry, storage, and refresh patterns.
- Review localStorage usage and alternatives.
- Confirm password reset and OTP lifecycle security.

### Phase 3: Authorization and access control
- Review IDOR/BOLA exposure on booking and payment routes.
- Review role boundaries between customer, technician, and admin.
- Review admin-only data access and mutation paths.

### Phase 4: Payment security
- Validate Razorpay order creation and verification logic.
- Review replay protection, amount validation, and race conditions.
- Evaluate frontend/backend trust boundaries and server-side canonical state.

### Phase 5: Infrastructure and deployment review
- Verify environment separation and secret handling.
- Review CI/CD, hosting, and secrets management practices.
- Confirm HTTPS, CORS, and security header defaults in production.

### Phase 6: Testing and remediation validation
- Add or review automated tests for auth, authorization, and payment verification.
- Validate fixes under realistic attack scenarios and regression conditions.

---

## Summary
This first phase confirms the application is a typical Node/Express + MongoDB + React/Vite stack with authentication, booking, payment, and email OTP flows. Security posture appears to include basic controls such as bcrypt, JWT, Helmet, CORS, and rate limiting for OTP requests. However, the repo also presents multiple audit priorities around localStorage JWT usage, authorization boundaries, payment replay/idempotency, and deployment secret management.

This document is an architecture and attack-surface map only. It does not represent a compliance conclusion or a completed remediation assessment.
