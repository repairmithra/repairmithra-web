# RepairMithra OWASP Top 10 2025 Security Review

## Executive Summary

This review covers the repository code under frontend/, backend/, security-audit/results/, and security-audit/logs/ for the OWASP Top 10 2025 categories A01-A10. The codebase is a Node.js/Express backend with a Vite React frontend and MongoDB persistence. The security posture is mixed but generally defensive in a few areas: password hashing uses bcrypt, JWTs are signed on the backend, OTP verification is hashed before storage, and rate limiting is applied to the email-verification endpoint.

The most significant issues identified are:

- Mixed access-control design: roles exist in the schema and JWT payload, but the authorization model is not consistently enforced for admin/technician responsibilities. Access is primarily based on `req.user._id` scoping rather than explicit RBAC enforcement.
- Security misconfiguration: CORS is enabled globally with no explicit origin restrictions, and Helmet is enabled only with default settings.
- Authentication weaknesses: the login flow has no rate limiting or lockout, and the JWT is stored in browser localStorage, which is exposed to client-side script compromise.
- Software/data integrity: remote third-party scripts are loaded without Subresource Integrity (SRI), including the Razorpay checkout script and Google Fonts CSS. The review confirms this is a valid integrity gap.
- Logging and exception handling: application errors are written to console output, but there is no meaningful security event logging or alerting pipeline for authentication abuse, payment anomalies, suspicious access, or repeated failures.

The supplied security artifacts did not show meaningful hardcoded secrets or high-confidence injection issues. Gitleaks returned no findings, npm audit reported no actionable advisories, and Nuclei was empty for the supplied target. Semgrep produced a single low-confidence missing-integrity finding in the frontend, which was reviewed and confirmed as a real concern. SonarQube and Trivy logs were inspected but no actionable findings were available in the final result files supplied under security-audit/results/.

This document is a review artifact only. It does not claim OWASP compliance or certification.

## A01 - Broken Access Control

### Confirmed vulnerabilities

- Access control is implemented mainly by user ownership checks (`customer: req.user._id`) for booking and payment operations, which is appropriate for ordinary customer flows. However, there is no explicit role-based authorization layer for admin or technician functions.
- The role field exists in the schema and the JWT payload, but it is not enforced in middleware or route protection. The JWT includes the role (`id` and `role`), but `authMiddleware` ignores it and only accepts any valid token: backend/src/middleware/authMiddleware.js, backend/src/utils/generateToken.js.
- There is no evidence of admin-only or technician-only authorization checks before sensitive operations. The route set uses `authMiddleware` only and does not implement an RBAC guard. See backend/src/routes/authRoutes.js, backend/src/routes/bookingRoutes.js, backend/src/routes/paymentRoutes.js, backend/src/routes/technicianRoutes.js.

### Potential risks requiring verification

- If admin or technician roles are added in the future without a dedicated middleware, the application may unintentionally expose privileged endpoints to any authenticated user.
- The application currently stores JWTs in browser localStorage. If a malicious script runs in the browser, the token can be read and replayed from any origin, amplifying access-control exposure.

### False positives / informational findings

- No direct privilege-escalation path was confirmed in the current route set because the backend does validate customer ownership in booking and payment reads.
- The lack of a central authorization module is a design risk, not a confirmed exploitation path in the existing code.

### Security impact

- An application that stores roles but does not enforce them can allow an authenticated user to access endpoints or data that should be restricted to administrators or technicians.
- The impact is higher in production environments with user-generated content and financial workflows because payment and booking records are sensitive.

### Recommended remediation

- Add explicit role-based middleware (e.g., `requireRole("admin")`, `requireRole("technician")`) and enforce it on privileged routes.
- Treat `req.user.role` as an authorization input, not just user metadata.
- Use short-lived JWTs and consider HttpOnly secure cookies instead of browser localStorage for session storage.
- Add tests that verify customers cannot access technician/admin routes and that admin-only operations require the correct role.

## A02 - Security Misconfiguration

### Confirmed vulnerabilities

- The backend enables CORS without any origin restrictions: app.use(cors()) in backend/src/app.js. This is a permissive default that is not suitable for production unless the whitelist is tightly controlled.
- Helmet is enabled in backend/src/app.js but only with default settings; no content-security-policy, frame-ancestors, referrer-policy, or strict transport security policy is configured for the application. This is not necessarily catastrophic, but it is a default misconfiguration pattern for production.
- The backend writes configuration presence checks to console output in backend/src/server.js, revealing when secret-bearing environment variables are loaded. This is not a secret leak by itself, but it is a weak operational safety practice and may reveal deployment assumptions during debugging.
- The MongoDB connection code sets DNS servers explicitly to public Google DNS (`8.8.8.8` and `8.8.4.4`) in backend/src/config/db.js. This is not inherently exploitable, but it is an unusual production configuration choice and may bypass internal network controls.

### Potential risks requiring verification

- CORS configuration should be verified against the allowed deployment origins (frontend netlify domain, local dev origin, etc.). If the app is served from multiple domains, the current default may be too broad.
- HSTS, CSP, and X-Frame-Options should be validated in the production deployment to ensure consistent browser hardening.

### False positives / informational findings

- Helmet is present and is a positive baseline. The issue is not that Helmet is missing, but that it is not tuned for the production deployment.
- The DNS override is not a confirmed vulnerability; it requires environment review to confirm whether it is intentional and safe.

### Security impact

- Global CORS permits browsers to make cross-origin authenticated requests from arbitrary origins unless the server restricts origin policy. This can expose APIs to cross-site abuse if the frontend and backend are not tightly segmented.
- Missing browser security headers increases exposure to clickjacking, XSS, and content injection risks.

### Recommended remediation

- Replace app.use(cors()) with a restrictive origin allowlist and explicit methods/headers.
- Configure Helmet with a production-appropriate policy set (CSP, frame-ancestors, noSniff, etc.).
- Validate the deployed environment for HSTS and secure cookie settings.
- Remove or justify the custom DNS configuration and confirm it aligns with enterprise environment controls.

## A03 - Software Supply Chain Failures

### Confirmed vulnerabilities

- No confirmed dependency compromise was identified in the supplied audit artifacts. Gitleaks reported no secrets, npm audit reported no actionable advisories in the supplied result, and the current Trivy output did not show a high-confidence vulnerability record for the repository state reviewed.
- The repository does include transitive dependencies in backend/package-lock.json, including axios 1.20.0. The presence of a transitive package is not itself a vulnerability, but it should be monitored because dependency trees can change without notice.

### Potential risks requiring verification

- Current lockfiles should be reviewed before production release to ensure no vulnerable transitive packages are introduced in future updates.
- The repository should verify whether the frontend or backend introduces third-party content over network and whether those dependencies are pinned by version and integrity.

### False positives / informational findings

- The Trivy result is a dependency inventory, not a confirmed vulnerability report in the current artifact set.
- `axios@1.20.0` is present but the supplied audit files do not show a known issue tied to this repository version at the time of review.

### Security impact

- Unreviewed dependencies can create attack surface through malicious or compromised packages, even when the application code is otherwise secure.
- Impact is lower in this review because no known exploitable vulnerability was observed in the supplied security artifacts.

### Recommended remediation

- Keep dependency lockfiles updated and reviewed as part of the release process.
- Maintain a software bill of materials and track transitive dependencies.
- Prefer pinned, auditable packages and enforce a CI dependency scan before merge.

## A04 - Cryptographic Failures

### Confirmed vulnerabilities

- No confirmed cryptographic failure was identified in the application code reviewed.
- Password hashing is implemented with bcrypt and a cost factor of 10 in backend/src/controllers/authController.js.
- JWTs are signed using `jsonwebtoken` with a shared secret from `process.env.JWT_SECRET`, and token expiry is set to 7 days in backend/src/utils/generateToken.js.
- OTP values are converted to a SHA-256 hash before storage in backend/src/controllers/authController.js, which is a common pattern for one-time verification codes.

### Potential risks requiring verification

- The JWT secret must be reviewed in the environment to ensure it is long, unique, and not shared across environments.
- The application should verify that production tokens are only sent over HTTPS and that secure cookies or equivalent transport protections are used.

### False positives / informational findings

- No weak algorithm usage was observed in the reviewed code. The default JWT algorithm is not explicitly overridden and is therefore the library default (HS256), which is standard for an application of this type.

### Security impact

- Cryptographic use is generally aligned with secure baselines for password hashing and JWT issuance. The principal risk is not a broken algorithm but misconfiguration or secret management weakness in deployment.

### Recommended remediation

- Use environment management and secret rotation controls to ensure the JWT secret is unique and strong.
- Verify that the app is served only over TLS and that cookies are secure if the session model is later changed.

## A05 - Injection

### Confirmed vulnerabilities

- No confirmed injection vulnerability was identified in the reviewed backend and frontend code.
- The application validates required fields, uses Mongoose queries with typed values and object IDs, and performs checks for valid numeric coordinates and date/time values in booking and technician search code.
- The OTP verification logic is hashed before comparison, which is the correct pattern for one-time codes.

### Potential risks requiring verification

- Ensure all user-controlled values are validated consistently before database writes, especially for any future admin or technician endpoints.
- Review all endpoints that use raw query strings, external API parameters, or dynamic database filters for future additions.

### False positives / informational findings

- A few logs and HTML templates include user-controlled values, but there is no confirmed injection path in the current code.

### Security impact

- Injection risk appears low based on the current implementation. The principal residual risk is future code growth without consistent validation.

### Recommended remediation

- Continue to validate and sanitize all user-driven fields, especially on any endpoint that accepts unbounded strings.
- Add automated tests for malformed input and boundary conditions.

## A06 - Insecure Design

### Confirmed vulnerabilities

- The application defines a role model (`customer`, `technician`, `admin`) in the user schema and includes `role` in the JWT payload, but the security design does not actually enforce role-based access control across the application. This is a design gap.
- The app relies on the `req.user._id` ownership pattern, which is acceptable for a customer workflow but incomplete for a multi-role system with administrative and technical operations. See backend/src/models/User.js and backend/src/utils/generateToken.js.
- No explicit threat model, security architecture for privileged operations, or admin/technician policy boundary was found in the code review.

### Potential risks requiring verification

- Determine whether the app intends to support admin or technician roles beyond the schema enum; if so, the missing authorization checks must be reviewed and implemented.
- Validate whether financial workflows and booking assignment use privileged state transitions that should be restricted by role, verification status, and ownership boundaries.

### False positives / informational findings

- This is not a bug in the current customer flows, but a design risk in the broader authorization model for a multi-role application.

### Security impact

- Without a deliberate authorization design, the application may be extended into privileged operations without appropriate guard rails. This can create access-control weaknesses as features are added.

### Recommended remediation

- Document the authorization model and create role-specific middleware and tests.
- Segment admin, technician, and customer actions into separate routes and enforce permissions at the route boundary.
- Add security design reviews for new financial, booking-assignment, and administrative features before deployment.

## A07 - Authentication Failures

### Confirmed vulnerabilities

- The login endpoint (`loginUser`) does not implement rate limiting or lockout protection. Repeated credential attempts can be made without throttling. See backend/src/controllers/authController.js and backend/src/routes/authRoutes.js.
- The application stores both JWT and user data in browser localStorage in frontend/src/utils/auth.js. LocalStorage is not a hardened session storage method because browser XSS can read it and replay tokens.
- The backend accepts any valid bearer token in `authMiddleware` without binding to a device, session, or user-agent requirement. This is a common design limitation for a browser-based session model and should be evaluated as an authentication control gap.

### Potential risks requiring verification

- Confirm the production deployment uses HTTPS-only and a strict CSP to reduce XSS risk; otherwise, localStorage token theft becomes a practical attack path.
- Validate whether login abuse protection should be implemented using rate limiting, CAPTCHA, or account lockout logic for the customer login endpoint.

### False positives / informational findings

- The use of bcrypt and password matching is correct. The issue is the absence of protection around repeated login attempts and the use of localStorage for session tokens.

### Security impact

- Attackers can perform credential stuffing or brute-force attacks at scale against the login endpoint with low operational friction.
- Compromise of client-side script execution could directly expose JWTs and permit unauthorized API access.

### Recommended remediation

- Add a dedicated login rate limiter and account lockout strategy for repeated failed credentials.
- Move session storage to HttpOnly secure cookies where possible, or otherwise reduce the exposure of tokens in browser storage.
- Consider token binding or refresh rotation for improved session security.

## A08 - Software or Data Integrity Failures

### Confirmed vulnerabilities

- The frontend loads remote resources without integrity attributes. The Semgrep finding is confirmed in frontend/index.html: external Google Fonts CSS and the Razorpay checkout script are requested without SRI. This creates a supply-chain / software-integrity risk if those resources are compromised or modified.
- The relevant code is in frontend/index.html around the external stylesheet and script tags.

### Potential risks requiring verification

- Verify that the external dependencies are loaded only from trusted sources and that the deployment does not allow unauthorized redirect or overridden scripts.
- Review whether the same pattern appears elsewhere in the frontend or any other static assets loaded from external origins.

### False positives / informational findings

- The issue was flagged as low confidence by Semgrep, but the finding is directly confirmed by source inspection and matches a valid software/data integrity concern.

### Security impact

- If an attacker alters a remote library or asset, the browser will execute it without verification, potentially leading to script injection or page compromise.
- This is especially relevant for payment flows and anything that runs in the browser before the app bootstraps.

### Recommended remediation

- Add Subresource Integrity (SRI) hashes for external CSS and JS resources, or self-host critical third-party assets.
- Prefer pinning versions and integrity validation for remote JS libraries.

## A09 - Security Logging & Alerting Failures

### Confirmed vulnerabilities

- The application logs routine errors to the console, but there is no evidence of a centralized security logging or alerting mechanism for failed logins, OTP abuse, payment verification failures, or suspicious access patterns. This is a security-logging gap.
- The code includes console-based error logging in most controllers, but there is no structured event model, no log retention policy, and no alerting pipeline. See backend/src/controllers/authController.js, backend/src/controllers/paymentController.js, backend/src/controllers/bookingController.js, backend/src/server.js.

### Potential risks requiring verification

- Determine whether production logs are shipped to a secure log aggregation system and whether that system is monitored.
- Validate whether security-relevant events such as repeated failed logins, invalid payment signatures, or OTP exhaustion are surfaced to operators.

### False positives / informational findings

- Console logging itself is not necessarily a vulnerability, but it is inadequate as a security monitoring control in a production environment.

### Security impact

- Without security event logging and alerting, suspicious or malicious activity may go unnoticed, delaying incident response and supporting forensic investigation.

### Recommended remediation

- Add structured security logging for failed auth attempts, OTP abuse, rate-limit events, payment failures, and abnormal access patterns.
- Route logs to a monitored log platform and establish alert thresholds and retention controls.

## A10 - Mishandling of Exceptional Conditions

### Confirmed vulnerabilities

- The application handles many common validation errors gracefully, but there is no evidence of hardened exception-handling for production security events. Raw error objects are printed to console in multiple controllers.
- Error handlers often return generic public responses, but the server also logs stack traces and other details to console. This is not a direct exploit, but it is a poor exception-handling posture for a production environment.
- The DB connection bootstrap calls `process.exit(1)` if the database cannot connect. This is a process hard-stop, which is not inherently insecure, but it should be evaluated as a production fail-closed design choice.

### Potential risks requiring verification

- Review whether production logs are exposed to developers via shared consoles or accessible terminals.
- Confirm whether authenticated error contexts or payment details are ever included in logs or returned to the client.

### False positives / informational findings

- No unhandled crash or obvious exception-level exploit was confirmed in the reviewed code.

### Security impact

- Excessive or unfiltered logging can leak internals, request details, and operational secrets to logs that may later become accessible to unauthorized users.
- Poor exception handling can reduce incident response quality and produce unstable application behavior under failure scenarios.

### Recommended remediation

- Replace console logging of raw exceptions with structured, sanitized logging.
- Centralize error handling for security-relevant events and ensure production logs omit sensitive details.
- Add tests for failure injection at key boundaries: auth, payment verification, and booking creation.

## Confirmed Vulnerabilities

1. Permissive CORS configuration in backend/src/app.js allows arbitrary browser origins unless restricted at deployment time.
2. Missing role-based authorization enforcement for admin/technician scopes despite a role model being present in backend/src/models/User.js and backend/src/utils/generateToken.js.
3. No login throttling or credential-stuffing protection in backend/src/routes/authRoutes.js and backend/src/controllers/authController.js.
4. JWTs stored in browser localStorage in frontend/src/utils/auth.js create attack surface for XSS-based token theft.
5. Missing SRI on remote frontend resources in frontend/index.html creates a software/data integrity risk.
6. Weak security logging and alerting: no evidence of structured monitoring for auth abuse or payment anomalies.

## Potential Risks Requiring Verification

- Confirm whether admin and technician flows are intended and whether the current routes are actually protected by role checks.
- Verify deployed allowed origins in the production CORS configuration.
- Review production environment secrets and JWT secret handling.
- Confirm whether login abuse protection is implemented at the reverse-proxy or WAF layer, even if not in the application code.
- Verify external asset loading and security headers in the live deployment.

## False Positives / Informational Findings

- Gitleaks returned no findings in the supplied scan artifact.
- Nuclei returned no findings for the supplied target.
- npm audit did not produce actionable advisories in the provided artifact.
- Trivy did not report a repository vulnerability in the supplied results.
- Semgrep reported a missing SRI issue in frontend/index.html, which was confirmed and mapped to A08; this is not a false positive.
- SonarQube scan logs indicate a scanner run, but no actionable issue list was provided in the result files under security-audit/results/.

## Dependency Findings

- No confirmed known supply-chain compromise was identified from the provided audit artifacts.
- The repository includes package lock files and a dependency tree that should be monitored for future transitive vulnerabilities.
- Example transitive package inventory includes axios 1.20.0; this should be tracked and reviewed with the release process, though no confirmed vulnerability is present in the supplied scan outputs.

## Security Tool Findings

- Gitleaks: no findings in supplied result JSON.
- Semgrep: one low-confidence missing-integrity result in frontend/index.html; reviewed and confirmed as a valid issue.
- Trivy: no actionable repository vulnerability result in the supplied artifact set.
- npm audit: no actionable advisories returned in the supplied result.
- Nuclei: empty result for the supplied target.
- SonarQube: scanner executed, but the supplied result artifacts did not include actionable issue data for direct mapping.

## Remediation Plan

1. Restrict CORS to explicit production origins and remove permissive defaults.
2. Implement RBAC middleware and enforce role checks for admin/technician functions.
3. Add login-rate limiting and credential-stuffing protections.
4. Move JWT session handling away from localStorage to HttpOnly secure cookies or another safer browser storage model.
5. Add SRI hashes for external third-party assets or self-host them.
6. Improve security logging by capturing failed auth, OTP abuse, payment-signature failures, and suspicious API access in a monitored system.
7. Sanitize production logs and ensure no sensitive data is emitted to console output.
8. Add automated tests for authorization boundaries, authentication throttling, and payment verification edge cases.

## Testing Required After Remediation

- Authentication and authorization regression tests for admin/customer/technician access.
- Rate-limit validation for login and OTP endpoints.
- Review of browser storage changes under XSS conditions and smoke tests for secure session behavior.
- Payment verification tests around invalid signatures, duplicate orders, and aborted flows.
- Frontend integrity validation for remote asset loading.
- Log verification to confirm that security events are emitted to the monitoring pipeline without exposing sensitive details.

## Final Audit Status

This review does not claim OWASP certification or full compliance. Based on the supplied source code and tool artifacts, the repository is in a partially hardened state with a small number of confirmed issues and several design-level concerns that require verification in the live deployment.

A01: NEEDS REVIEW
A02: FINDINGS
A03: PASS
A04: PASS
A05: PASS
A06: FINDINGS
A07: FINDINGS
A08: FINDINGS
A09: NEEDS REVIEW
A10: NEEDS REVIEW
