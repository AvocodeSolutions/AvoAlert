# Implementation Plan

- [x] 1. Set up project structure and shared configurations

  - [x] Create monorepo structure with separate directories for each service
  - [x] Set up shared TypeScript configurations and ESLint rules
  - [ ] Create shared types and interfaces package
  - [ ] Set up environment variable templates for all services
  - [ ] Create shared ESLint configuration
  - [ ] Set up admin-panel service structure
  - _Requirements: 6.3, 9.4_

- [ ] 2. Implement database schema and migrations
  - Set up Prisma schema with all required tables and relationships
  - Create database migration files for initial schema
  - Implement database seeding scripts for development data
  - Add database indexes for performance optimization
  - Write database connection utilities with error handling
  - _Requirements: 1.2, 4.2, 5.2, 8.5_

- [ ] 3. Create shared authentication and validation utilities
  - Implement Supabase JWT validation middleware
  - Create request validation schemas using Zod
  - Build rate limiting middleware with Redis backend
  - Implement error handling utilities and custom error classes
  - Write logging utilities with structured logging format
  - _Requirements: 6.1, 6.2, 6.4, 10.1_

- [ ] 4. Build signal-engine service
- [ ] 4.1 Create Express.js server with webhook endpoint
  - Set up Express.js application with TypeScript
  - Implement TradingView webhook endpoint with payload validation
  - Add webhook signature verification for security
  - Create health check endpoints for monitoring
  - Write unit tests for webhook validation logic
  - _Requirements: 3.1, 6.1, 10.4_

- [ ] 4.2 Implement BullMQ job queue integration
  - Set up BullMQ connection to Upstash Redis
  - Create signal processing job queue with proper configuration
  - Implement job producer to queue validated webhook payloads
  - Add job retry logic with exponential backoff
  - Write integration tests for queue operations
  - _Requirements: 3.1, 7.1, 7.4_

- [ ] 4.3 Add monitoring and error handling
  - Implement Prometheus metrics collection for webhook processing
  - Add structured logging for all webhook events
  - Create circuit breaker for external service calls
  - Implement graceful shutdown handling
  - Write load tests for webhook endpoint performance
  - _Requirements: 7.1, 10.1, 10.2, 10.4_

- [ ] 5. Build alarm-dispatcher service
- [ ] 5.1 Create job consumer and signal processing logic
  - Set up Express.js service with BullMQ job consumer
  - Implement signal processing workflow to match user alarms
  - Create database queries to find active alarms for signals
  - Add user credit validation and deduction logic
  - Write unit tests for signal matching algorithms
  - _Requirements: 3.2, 3.3, 5.3, 7.2_

- [ ] 5.2 Implement notification providers
  - Create email notification service using Resend API
  - Implement SMS notification service with Netgsm integration
  - Add Twilio SMS fallback provider for reliability
  - Create web push notification service using OneSignal
  - Build notification template system for different signal types
  - _Requirements: 3.1, 7.3, 7.4_

- [ ] 5.3 Add notification delivery and retry logic
  - Implement notification delivery workflow with status tracking
  - Create retry mechanisms for failed notifications
  - Add delivery status updates to notification history
  - Implement fallback provider switching for SMS
  - Write integration tests for all notification providers
  - _Requirements: 3.4, 7.4, 10.4_

- [ ] 6. Build api-gateway service
- [ ] 6.1 Create REST API endpoints for user management
  - Set up Express.js server with authentication middleware
  - Implement user profile CRUD endpoints
  - Create user alarm management endpoints
  - Add user notification history endpoints
  - Write API documentation using OpenAPI/Swagger
  - _Requirements: 4.1, 4.2, 4.3, 6.1, 6.3_

- [ ] 6.2 Implement subscription and billing endpoints
  - Create subscription plan listing endpoints
  - Implement user subscription status endpoints
  - Add credit balance and transaction history endpoints
  - Create Stripe Checkout session creation endpoint
  - Write unit tests for all API endpoints
  - _Requirements: 5.1, 5.5, 6.1, 6.3_

- [ ] 6.3 Add API security and rate limiting
  - Implement JWT token validation for all protected routes
  - Add role-based access control for admin endpoints
  - Create rate limiting middleware with user-specific limits
  - Implement request sanitization and CORS configuration
  - Write security tests for authentication and authorization
  - _Requirements: 6.1, 6.2, 6.4, 8.3_

- [ ] 7. Build subscription-service
- [ ] 7.1 Create Stripe webhook handler
  - Set up Express.js service for Stripe webhook processing
  - Implement webhook signature verification
  - Create handlers for subscription lifecycle events
  - Add payment success and failure event processing
  - Write unit tests for webhook event handling
  - _Requirements: 5.2, 5.3, 5.4, 6.1_

- [ ] 7.2 Implement credit management system
  - Create credit allocation logic for new subscriptions
  - Implement credit deduction tracking for signal usage
  - Add subscription status monitoring and updates
  - Create credit transaction history recording
  - Write integration tests with Stripe test environment
  - _Requirements: 3.3, 5.2, 5.3, 5.5_

- [ ] 8. Build admin-panel interface
- [ ] 8.1 Create UT Bot configuration interface
  - Set up Next.js application with Shadcn/ui components
  - Implement UT Bot parameter configuration forms
  - Create Pine Script code generation functionality
  - Add webhook URL generation for TradingView setup
  - Write component tests for configuration interface
  - _Requirements: 1.1, 1.2, 1.3, 2.1_

- [ ] 8.2 Implement monitoring dashboard
  - Create real-time queue monitoring interface
  - Implement system metrics dashboard with charts
  - Add user management and support tools
  - Create signal delivery analytics and reporting
  - Write E2E tests for admin panel workflows
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 10.2, 10.5_

- [ ] 9. Build web-client interface
- [ ] 9.1 Create user authentication and registration
  - Set up Next.js application with Supabase authentication
  - Implement user registration and login flows
  - Create password reset and email verification
  - Add user profile management interface
  - Write component tests for authentication flows
  - _Requirements: 4.1, 6.1, 8.1, 8.2_

- [ ] 9.2 Implement alarm management interface
  - Create alarm creation and configuration forms
  - Implement alarm listing and management interface
  - Add notification channel preference settings
  - Create alarm history and statistics display
  - Write E2E tests for alarm management workflows
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 9.3 Create subscription and billing interface
  - Implement subscription plan selection and comparison
  - Create Stripe Checkout integration for payments
  - Add billing history and invoice management
  - Implement credit balance display and usage tracking
  - Write payment flow tests with Stripe test mode
  - _Requirements: 5.1, 5.5, 6.3_

- [ ] 10. Implement monitoring and observability
- [ ] 10.1 Set up Prometheus metrics collection
  - Add Prometheus client libraries to all services
  - Implement custom metrics for business logic
  - Create service health and performance metrics
  - Set up metrics endpoints for Prometheus scraping
  - Write tests to verify metrics collection accuracy
  - _Requirements: 10.2, 10.4, 10.5_

- [ ] 10.2 Configure Grafana dashboards and alerting
  - Create Grafana dashboards for system monitoring
  - Implement alerting rules for critical system events
  - Set up notification channels for alerts (Slack/email)
  - Create runbooks for common incident scenarios
  - Test alerting system with simulated failures
  - _Requirements: 2.2, 2.3, 9.3, 10.2_

- [ ] 11. Implement security and compliance features
- [ ] 11.1 Add data protection and privacy controls
  - Implement GDPR/KVKK compliant data handling
  - Create user data export and deletion functionality
  - Add consent management and privacy settings
  - Implement log redaction for sensitive information
  - Write compliance tests for data protection requirements
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ] 11.2 Enhance security measures
  - Implement comprehensive input validation and sanitization
  - Add SQL injection and XSS protection
  - Create security headers and HTTPS enforcement
  - Implement audit logging for sensitive operations
  - Conduct security testing and vulnerability assessment
  - _Requirements: 6.4, 8.3, 8.4_

- [ ] 12. Set up deployment and CI/CD pipeline
- [ ] 12.1 Configure deployment environments
  - Set up Vercel deployment for Next.js applications
  - Configure Render deployment for Express.js services
  - Create environment-specific configuration management
  - Set up database migrations for production deployment
  - Write deployment verification tests
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 12.2 Implement CI/CD automation
  - Create GitHub Actions workflows for automated testing
  - Set up automated deployment pipelines
  - Implement database backup and restore procedures
  - Create monitoring for deployment health
  - Write integration tests for full system deployment
  - _Requirements: 9.1, 9.2, 9.5_

- [ ] 13. Conduct system testing and optimization
- [ ] 13.1 Perform load and performance testing
  - Create load testing scenarios for high signal volume
  - Test system performance under peak load conditions
  - Optimize database queries and API response times
  - Validate queue processing capacity and scaling
  - Write performance benchmarks and monitoring
  - _Requirements: 7.1, 7.2, 9.1, 10.4_

- [ ] 13.2 Execute end-to-end system validation
  - Test complete user workflows from registration to notifications
  - Validate payment processing and subscription management
  - Test admin panel functionality and monitoring
  - Verify error handling and recovery procedures
  - Conduct final security and compliance review
  - _Requirements: 3.1, 4.1, 5.1, 8.1, 9.1_