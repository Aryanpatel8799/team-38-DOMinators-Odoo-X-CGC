# 🛡️ RoadGuard Backend API

**Professional Roadside Assistance Platform** - A comprehensive, production-ready Node.js backend for connecting customers with mechanics for real-time vehicle services.

## 🎯 Quick Start for Frontend Development

**Backend URL:** `http://localhost:4000`  
**API Base:** `http://localhost:4000/api`  
**Socket.io:** `http://localhost:4000`  
**API Documentation:** `http://localhost:4000/api-docs`

### � Installation & Setup

```bash
# Clone and install
git clone <repository-url>
cd roadguard/backend
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configurations

# Start development server
npm run dev
```

**Server runs on:** `http://localhost:4000`

## 🚀 Core Features

### 🔐 Authentication System
- **JWT-based authentication** with access/refresh tokens
- **Email OTP verification** for secure login
- **Role-based access control** (Customer, Mechanic, Admin)
- **Password reset** with email OTP
- **Account verification** via email
- **Rate limiting** and security middleware

### 📱 Real-time Features (Socket.io)
- **Live location tracking** of mechanics
- **Real-time status updates** for service requests
- **Instant chat** between customers and mechanics
- **Emergency alerts** with immediate notifications
- **Live notifications** for all users
- **Authenticated socket connections**

### 💳 Payment Processing
- **Razorpay integration** for secure payments
- **Payment verification** and webhook handling
- **Payment history** and transaction records
- **Refund management** system
- **Multiple payment methods** support

### 🔧 Service Management
- **Complete request lifecycle** (pending → assigned → in_progress → completed)
- **Intelligent mechanic assignment** based on location and availability
- **AI-powered quotations** with cost estimation
- **Image uploads** for vehicle issue documentation
- **Work summary tracking** and completion reports
- **Service categories** (Engine, Electrical, Tires, etc.)

### ⭐ Review & Rating System
- **Customer reviews and ratings** (1-5 stars)
- **Mechanic performance tracking** with detailed metrics
- **Review analytics** and insights dashboard
- **Tag-based feedback** system
- **Rating aggregation** and statistics

### 📊 Admin Dashboard & Analytics
- **Comprehensive analytics** with charts and metrics
- **User and mechanic management** with full CRUD operations
- **Revenue tracking** and financial reports
- **Data export** capabilities (CSV, Excel)
- **System monitoring** and health checks
- **Real-time KPIs** and performance metrics

### 📧 Email & Communication
- **Professional HTML email templates** with branding
- **OTP delivery** for secure authentication
- **Welcome emails** for new user onboarding
- **Service notifications** and status updates
- **Payment confirmations** and receipts
- **Emergency alert** notifications

## 🏗️ Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Two-Factor Authentication
- **Email Service**: NodeMailer with SMTP
- **Real-time**: Socket.io with authentication
- **Payments**: Razorpay integration
- **File Storage**: Cloudinary
- **Validation**: Joi schemas
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston with multiple transports
- **Testing**: Jest with comprehensive test suites

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── cloudinary.js          # Cloudinary file storage
│   │   ├── database.js            # MongoDB connection
│   │   ├── logger.js              # Winston logging setup
│   │   └── swagger.js             # API documentation
│   ├── controllers/
│   │   ├── adminController.js     # Admin operations & analytics
│   │   ├── authController.js      # Authentication & OTP verification
│   │   ├── customerController.js  # Customer profile & requests
│   │   ├── mechanicController.js  # Mechanic operations & earnings
│   │   ├── paymentController.js   # Payment processing & history
│   │   ├── requestController.js   # Service request management
│   │   ├── reviewController.js    # Reviews & ratings
│   │   └── userController.js      # User profile management
│   ├── middlewares/
│   │   ├── authMiddleware.js      # JWT authentication & rate limiting
│   │   ├── errorMiddleware.js     # Global error handling
│   │   ├── rateLimitMiddleware.js # API rate limiting
│   │   ├── uploadMiddleware.js    # File upload handling
│   │   └── validationMiddleware.js # Request validation
│   ├── models/
│   │   ├── OTP.js                 # OTP verification records
│   │   ├── Payment.js             # Payment transactions
│   │   ├── Review.js              # Customer reviews
│   │   ├── ServiceRequest.js      # Service requests
│   │   └── User.js                # User accounts (customers/mechanics)
│   ├── routes/
│   │   ├── adminRoutes.js         # Admin dashboard APIs
│   │   ├── authRoutes.js          # Authentication endpoints
│   │   ├── customerRoutes.js      # Customer APIs
│   │   ├── mechanicRoutes.js      # Mechanic APIs
│   │   ├── paymentRoutes.js       # Payment endpoints
│   │   └── requestRoutes.js       # Service request APIs
│   ├── services/
│   │   ├── aiQuotationService.js  # AI-powered quotations
│   │   ├── emailService.js        # Email templates & SMTP
│   │   ├── notificationService.js # Push notifications
│   │   ├── otpService.js          # OTP generation & verification
│   │   ├── paymentService.js      # Payment processing
│   │   └── socketService.js       # Real-time communication
│   ├── socket/
│   │   └── socketHandlers.js      # Socket.io event handlers
│   ├── tests/
│   │   ├── integration/           # Integration test suites
│   │   └── unit/                  # Unit test suites
│   └── utils/
│       ├── constants.js           # Application constants
│       ├── helpers.js             # Utility functions
│       └── response.js            # Standardized API responses
├── logs/                          # Application logs
├── uploads/                       # Temporary file uploads
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore configuration
├── package.json                   # Dependencies & scripts
├── server.js                      # Application entry point
├── app.js                         # Express app configuration
├── OTP_EMAIL_SETUP_GUIDE.md       # Email setup documentation
├── OTP_IMPLEMENTATION_SUMMARY.md  # Technical implementation details
└── README.md                      # This comprehensive guide
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- NPM or Yarn
- Gmail account for email services (or other SMTP provider)

### 1. Clone & Install
```bash
git clone <repository-url>
cd roadguard/backend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

### 3. Complete Environment Variables

**Critical Configuration for Full Functionality:**

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/roadguard

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure
JWT_REFRESH_SECRET=your_refresh_token_secret_here_also_very_long
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email Service (REQUIRED for OTP Authentication)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM_NAME=RoadGuard Support
EMAIL_FROM_ADDRESS=your_email@gmail.com
EMAIL_SERVICE=gmail
EMAIL_SECURE=false

# Payment Processing
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# SMS Service (Optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Client Configuration
FRONTEND_URL=http://localhost:3000

# Security & Performance
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/
```

### 4. Gmail Configuration for OTP Emails
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
   - Use this app password as `EMAIL_PASS` (not your regular Gmail password)

### 5. Database Setup
```bash
# Start MongoDB
mongod

# Optional: Seed with demo data
npm run seed:demo
```

### 6. Start Development Server
```bash
npm run dev
```

🎉 **Server starts at:** `http://localhost:4000`
📚 **API Documentation:** `http://localhost:4000/api-docs`

## 📦 NPM Scripts

```bash
npm start              # Production server
npm run dev            # Development with auto-reload
npm run test           # Run comprehensive test suite
npm run test:unit      # Unit tests only
npm run test:integration # Integration tests only
npm run seed:demo      # Populate with demo data
npm run lint           # Code linting
npm run lint:fix       # Auto-fix linting issues
npm run docs           # Generate API documentation
```

## 🔗 Complete API Reference

### 🔐 Authentication Endpoints

#### Two-Step Login Process
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response:** OTP sent to email
```json
{
  "success": true,
  "message": "Credentials verified. OTP sent to your email for verification.",
  "data": {
    "requiresOTP": true,
    "email": "user@example.com",
    "message": "Please check your email for the OTP to complete login"
  }
}
```

#### Complete Login with OTP
```http
POST /auth/verify-login-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:** Authentication tokens
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "customer",
      "isVerified": true
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### Resend Login OTP
```http
POST /auth/resend-login-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Other Auth Endpoints
- `POST /auth/register` - User registration
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with OTP
- `POST /auth/send-otp` - Send OTP for verification
- `POST /auth/verify-otp` - Verify OTP

### 👤 Customer APIs

#### Profile Management
- `GET /customer/profile` - Get customer profile
- `PUT /customer/profile` - Update customer profile
- `POST /customer/upload-avatar` - Upload profile picture

#### Service Requests
```http
POST /customer/requests
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "issueType": "flat_tire",
  "description": "Front left tire is completely flat",
  "vehicleInfo": {
    "type": "car",
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "plate": "ABC123"
  },
  "location": {
    "lat": 28.6139,
    "lng": 77.2090,
    "address": "Connaught Place, New Delhi"
  },
  "priority": "high"
}
```

- `GET /customer/requests` - Get all customer requests
- `GET /customer/requests/:id` - Get specific request details
- `PUT /customer/requests/:id/cancel` - Cancel service request
- `POST /customer/requests/:id/review` - Submit review after service

### 🔧 Mechanic APIs

#### Profile & Availability
- `GET /mechanic/profile` - Get mechanic profile
- `PUT /mechanic/profile` - Update mechanic profile
- `PUT /mechanic/availability` - Update availability status
- `POST /mechanic/location` - Update current location

#### Request Management
- `GET /mechanic/requests/nearby` - Get nearby service requests
- `GET /mechanic/requests/assigned` - Get assigned requests
- `POST /mechanic/requests/:id/accept` - Accept service request
- `POST /mechanic/requests/:id/quote` - Submit quotation
- `PUT /mechanic/requests/:id/status` - Update request status
- `POST /mechanic/requests/:id/complete` - Mark request as completed

#### Earnings & Analytics
- `GET /mechanic/earnings` - Get earnings summary
- `GET /mechanic/earnings/detailed` - Detailed earnings report
- `GET /mechanic/analytics` - Performance analytics

### 👨‍💼 Admin APIs

#### Dashboard & Analytics
- `GET /admin/dashboard` - Dashboard overview
- `GET /admin/analytics/revenue` - Revenue analytics
- `GET /admin/analytics/users` - User analytics
- `GET /admin/analytics/requests` - Service request analytics

#### User Management
- `GET /admin/users` - Get all users with filters
- `GET /admin/users/:id` - Get specific user details
- `PUT /admin/users/:id/status` - Update user status
- `PUT /admin/users/:id/verify` - Verify user account

#### Content Management
- `GET /admin/requests` - All service requests
- `GET /admin/payments` - All payment records
- `GET /admin/reviews` - All reviews and ratings
- `POST /admin/export` - Export data in various formats

### 💳 Payment APIs

#### Payment Processing
```http
POST /payment/create-order
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "serviceRequestId": "request_id",
  "amount": 2500,
  "currency": "INR"
}
```

- `POST /payment/verify` - Verify payment after completion
- `GET /payment/history` - Payment history for user
- `POST /payment/refund` - Process refund
- `POST /payment/webhook` - Razorpay webhook handler

### 📝 Review & Rating APIs
- `POST /reviews` - Submit review and rating
- `GET /reviews/mechanic/:mechanicId` - Get mechanic reviews
- `GET /reviews/customer/:customerId` - Get customer reviews
- `PUT /reviews/:id` - Update review (within 24 hours)

## 🔌 Real-time Socket.io Events

### Client → Server Events

```javascript
// Join request room for real-time updates
socket.emit('join_request', { requestId: 'request_id' });

// Update location in real-time
socket.emit('update_location', {
  lat: 28.6139,
  lng: 77.2090,
  accuracy: 10
});

// Send chat message
socket.emit('send_message', {
  requestId: 'request_id',
  message: 'On my way, will reach in 10 minutes',
  sender: 'mechanic'
});

// Emergency alert
socket.emit('emergency_alert', {
  requestId: 'request_id',
  type: 'accident',
  location: { lat: 28.6139, lng: 77.2090 }
});
```

### Server → Client Events

```javascript
// Request status updates
socket.on('request_updated', (data) => {
  console.log('Request status:', data.status);
});

// Real-time location tracking
socket.on('location_updated', (data) => {
  console.log('New location:', data.lat, data.lng);
});

// Chat messages
socket.on('new_message', (data) => {
  console.log('Message from:', data.sender, data.message);
});

// Emergency notifications
socket.on('emergency_alert', (data) => {
  console.log('Emergency:', data.type, data.location);
});
```

## 🧪 Demo Data & Testing

### Seed Demo Data
```bash
npm run seed:demo
```

### Demo User Accounts

**Admin Account:**
- Email: `admin@roadguard.com`
- Password: `Admin123!`
- Access: Full system administration

**Customer Accounts:**
- Email: `john.doe@example.com` / Password: `Customer123!`
- Email: `sarah.wilson@example.com` / Password: `Customer123!`
- Email: `mike.brown@example.com` / Password: `Customer123!`

**Mechanic Accounts:**
- Email: `rajesh.kumar@roadguard.com` / Password: `Mechanic123!`
  - Specialization: Engine & Transmission
  - Location: Delhi NCR
- Email: `amit.sharma@roadguard.com` / Password: `Mechanic123!`
  - Specialization: Electrical & Battery
  - Location: Mumbai
- Email: `pradeep.singh@roadguard.com` / Password: `Mechanic123!`
  - Specialization: Tires & Brakes
  - Location: Bangalore

### API Testing with Postman

**Import Collection:**
```bash
# Download Postman collection
curl -o roadguard-api.json http://localhost:4000/api/postman-collection
```

**Test Sequence:**
1. Register new user → Verify email OTP
2. Login → Get OTP → Verify OTP → Receive tokens
3. Create service request with location
4. Mechanic accepts request
5. Real-time location updates
6. Complete service and payment
7. Submit review and rating

## 📊 Email Templates & Communication

### OTP Email Template
Professional HTML email with:
- Company branding and logo
- Clear OTP display
- Expiry information
- Security instructions
- Contact information

### Welcome Email Template
- Personalized greeting
- Platform introduction
- Getting started guide
- Support contact details

### Service Notifications
- Request status updates
- Payment confirmations
- Completion certificates
- Emergency alerts

## 🔒 Security Features

### Authentication Security
- **Two-Factor Authentication** with email OTP
- **JWT Token Rotation** with access/refresh pattern
- **Rate Limiting** on sensitive endpoints
- **Account Lockout** after failed attempts
- **Password Complexity** requirements

### Data Protection
- **Input Validation** with Joi schemas
- **SQL Injection Prevention** via Mongoose ODM
- **XSS Protection** with Helmet middleware
- **CORS Configuration** for specific origins
- **File Upload Security** with type/size validation

### API Security
- **Request Rate Limiting** (100 requests per 15 minutes)
- **OTP Rate Limiting** (1 OTP per minute)
- **Sensitive Data Masking** in logs
- **Error Information Filtering** in production
- **Security Headers** with Helmet

## 🚀 Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/roadguard
FRONTEND_URL=https://your-domain.com
EMAIL_USER=production-email@yourdomain.com
EMAIL_PASS=production-app-password
# ... other production configs
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

### Performance Optimization
- MongoDB indexing for frequently queried fields
- Image compression and CDN delivery
- API response caching
- Database connection pooling
- Log rotation and management

## 📈 Monitoring & Analytics

### Application Metrics
- Request/response times
- Error rates and types
- User authentication patterns
- Payment success rates
- Email delivery statistics

### Business Metrics
- Service request completion rates
- Customer satisfaction scores
- Mechanic performance ratings
- Revenue and payment analytics
- Geographic service distribution

## 🛠️ Frontend Integration Guide

### Authentication Flow for Frontend

```javascript
// 1. Login - First Step
const loginStep1 = async (email, password) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.success && data.data.requiresOTP) {
    // Show OTP input form
    return { needsOTP: true, email: data.data.email };
  }
};

// 2. Login - OTP Verification
const loginStep2 = async (email, otp) => {
  const response = await fetch('/auth/verify-login-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  
  const data = await response.json();
  if (data.success) {
    // Store tokens and user data
    localStorage.setItem('accessToken', data.data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return { success: true, user: data.data.user };
  }
};

// 3. API Requests with Token
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('accessToken');
  return fetch(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};
```

### Real-time Integration

```javascript
// Socket.io connection with authentication
import io from 'socket.io-client';

const connectSocket = (token) => {
  const socket = io('http://localhost:4000', {
    auth: { token }
  });
  
  // Listen for real-time updates
  socket.on('request_updated', (data) => {
    // Update UI with new request status
    updateRequestStatus(data);
  });
  
  socket.on('location_updated', (data) => {
    // Update mechanic location on map
    updateMechanicLocation(data);
  });
  
  return socket;
};
```

### Service Request Flow

```javascript
// Create service request
const createServiceRequest = async (requestData) => {
  const response = await apiCall('/customer/requests', {
    method: 'POST',
    body: JSON.stringify({
      issueType: 'flat_tire',
      description: requestData.description,
      vehicleInfo: requestData.vehicle,
      location: requestData.location,
      priority: 'high'
    })
  });
  
  return response.json();
};

// Track request status
const trackRequest = (requestId, socket) => {
  socket.emit('join_request', { requestId });
  
  socket.on('request_updated', (data) => {
    // Update UI based on status
    switch(data.status) {
      case 'pending':
        showSearchingForMechanic();
        break;
      case 'accepted':
        showMechanicAssigned(data.mechanic);
        break;
      case 'in_progress':
        showServiceInProgress();
        break;
      case 'completed':
        showServiceCompleted();
        break;
    }
  });
};
```

## 🎯 Frontend Development Checklist

### Essential Features to Implement

**Authentication & User Management:**
- [ ] Login form with email/password
- [ ] OTP verification modal/page
- [ ] Resend OTP functionality
- [ ] User registration flow
- [ ] Password reset with email OTP
- [ ] Profile management pages

**Customer Interface:**
- [ ] Service request form with location picker
- [ ] Real-time request tracking with map
- [ ] Chat interface with assigned mechanic
- [ ] Payment integration with Razorpay
- [ ] Review and rating system
- [ ] Request history and details

**Mechanic Interface:**
- [ ] Dashboard with nearby requests
- [ ] Request acceptance/rejection
- [ ] Navigation to customer location
- [ ] Service completion workflow
- [ ] Earnings and analytics dashboard
- [ ] Profile and availability management

**Admin Interface:**
- [ ] Analytics dashboard with charts
- [ ] User management interface
- [ ] Service request monitoring
- [ ] Payment and revenue reports
- [ ] System health monitoring

**Real-time Features:**
- [ ] Live location tracking
- [ ] Instant notifications
- [ ] Real-time chat
- [ ] Status updates
- [ ] Emergency alerts

### Recommended Tech Stack for Frontend
- **React.js** or **Next.js** for web application
- **React Native** or **Flutter** for mobile apps
- **Socket.io-client** for real-time features
- **Google Maps API** for location services
- **Razorpay SDK** for payment integration
- **Chart.js** or **Recharts** for analytics
- **TailwindCSS** or **Material-UI** for styling

### API Integration Patterns

**Error Handling:**
```javascript
const handleApiError = (response, data) => {
  if (!response.ok) {
    switch (response.status) {
      case 401:
        // Token expired - redirect to login
        redirectToLogin();
        break;
      case 400:
        // Validation error - show form errors
        showValidationErrors(data.errors);
        break;
      case 429:
        // Rate limit - show cooldown message
        showRateLimitMessage(data.message);
        break;
      default:
        showGenericError();
    }
  }
};
```

**State Management:**
```javascript
// Recommended state structure
const appState = {
  auth: {
    user: null,
    tokens: null,
    isAuthenticated: false,
    otpStep: false
  },
  requests: {
    current: null,
    history: [],
    tracking: false
  },
  location: {
    current: null,
    permissions: false
  },
  notifications: [],
  loading: false,
  errors: {}
};
```

## 📞 Support & Documentation

- **API Documentation**: `http://localhost:4000/api-docs`
- **Email Setup Guide**: `OTP_EMAIL_SETUP_GUIDE.md`
- **Implementation Details**: `OTP_IMPLEMENTATION_SUMMARY.md`
- **Test Coverage Report**: Run `npm run test:coverage`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**🚀 Ready for Production Deployment!**

This backend provides everything needed for a complete roadside assistance platform with enterprise-grade security, real-time features, and comprehensive API coverage. Perfect for building modern web and mobile applications!

Made with ❤️ for **RoadGuard** - *Your trusted roadside companion*

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.io
- **Payments**: Razorpay
- **File Storage**: Cloudinary
- **Notifications**: Email (Nodemailer) & SMS
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **Validation**: Joi

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── cloudinary.js      # Cloudinary configuration
│   │   ├── db.js              # MongoDB connection
│   │   ├── logger.js          # Winston logger setup
│   │   └── razorpay.js        # Razorpay configuration
│   ├── controllers/
│   │   ├── adminController.js     # Admin operations
│   │   ├── authController.js      # Authentication
│   │   ├── mechanicController.js  # Mechanic operations
│   │   ├── paymentController.js   # Payment processing
│   │   ├── requestController.js   # Service requests
│   │   ├── reviewController.js    # Reviews & ratings
│   │   └── userController.js      # User management
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   ├── authorize.js       # Role-based authorization
│   │   ├── errorHandler.js    # Global error handling
│   │   ├── rateLimiter.js     # Rate limiting
│   │   ├── upload.js          # File upload handling
│   │   └── validator.js       # Request validation
│   ├── models/
│   │   ├── OTP.js             # OTP verification
│   │   ├── Payment.js         # Payment records
│   │   ├── Review.js          # Reviews & ratings
│   │   ├── ServiceRequest.js  # Service requests
│   │   └── User.js            # User accounts
│   ├── routes/
│   │   ├── adminRoutes.js     # Admin API endpoints
│   │   ├── authRoutes.js      # Authentication endpoints
│   │   ├── customerRoutes.js  # Customer API endpoints
│   │   ├── mechanicRoutes.js  # Mechanic API endpoints
│   │   └── paymentRoutes.js   # Payment endpoints
│   ├── services/
│   │   ├── aiQuotationService.js  # AI quotation generation
│   │   ├── notificationService.js # Email/SMS notifications
│   │   ├── paymentService.js      # Payment processing
│   │   └── uploadService.js       # File upload handling
│   ├── socket/
│   │   └── requestSocket.js   # Socket.io implementation
│   └── utils/
│       ├── constants.js       # Application constants
│       ├── helpers.js         # Utility functions
│       └── validators.js      # Validation schemas
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies & scripts
├── seed.js                  # Demo data seeding
├── server.js               # Application entry point
└── README.md              # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- NPM or Yarn

### 1. Clone & Install
```bash
git clone <repository-url>
cd roadguard/backend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` file with your configurations:

```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/roadguard

# JWT Configuration
JWT_ACCESS_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# SMS Configuration (Twilio or similar)
SMS_API_KEY=your_sms_api_key
SMS_API_SECRET=your_sms_api_secret

# AI Service Configuration
AI_API_URL=your_ai_service_url
AI_API_KEY=your_ai_api_key

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### 3. Database Setup
```bash
# Start MongoDB (if running locally)
mongod

# Seed demo data (optional)
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```

The server will start at `http://localhost:4000`

## 📦 NPM Scripts

```bash
npm start           # Start production server
npm run dev         # Start development server with nodemon
npm run seed        # Seed database with demo data
npm run lint        # Run ESLint
npm run test        # Run tests (if configured)
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Verify email OTP
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Customer APIs
- `GET /api/customer/profile` - Get customer profile
- `PUT /api/customer/profile` - Update customer profile
- `POST /api/customer/request` - Create service request
- `GET /api/customer/requests` - Get customer's requests
- `PUT /api/customer/request/:id/cancel` - Cancel request

### Mechanic APIs
- `GET /api/mechanic/profile` - Get mechanic profile
- `PUT /api/mechanic/profile` - Update mechanic profile
- `GET /api/mechanic/requests` - Get assigned requests
- `PUT /api/mechanic/request/:id/accept` - Accept request
- `PUT /api/mechanic/request/:id/complete` - Complete request
- `GET /api/mechanic/earnings` - Get earnings summary

### Admin APIs
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/user/:id/status` - Update user status
- `GET /api/admin/analytics` - Detailed analytics
- `GET /api/admin/export` - Export data

### Payment APIs
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment
- `GET /api/payment/history` - Payment history
- `POST /api/payment/webhook` - Razorpay webhook

## 🔌 Socket.io Events

### Client → Server
- `join_request` - Join request room
- `update_location` - Update real-time location
- `send_message` - Send chat message
- `emergency_alert` - Send emergency alert

### Server → Client
- `request_updated` - Request status changed
- `mechanic_location` - Mechanic location update
- `new_message` - New chat message
- `emergency_received` - Emergency alert received

## 🧪 Demo Data

Run the seed script to populate the database with demo data:

```bash
npm run seed
```

### Demo User Accounts

**Admin:**
- Email: `admin@roadguard.com`
- Password: `Admin123!`

**Customers:**
- Email: `john@example.com` / Password: `Customer123!`
- Email: `sarah@example.com` / Password: `Customer123!`
- Email: `mike@example.com` / Password: `Customer123!`

**Mechanics:**
- Email: `rajesh@roadguard.com` / Password: `Mechanic123!`
- Email: `amit@roadguard.com` / Password: `Mechanic123!`
- Email: `pradeep@roadguard.com` / Password: `Mechanic123!`
- Email: `vikram@roadguard.com` / Password: `Mechanic123!`

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/roadguard
CLIENT_URL=https://your-frontend-domain.com
```

### Docker Deployment (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

### Heroku Deployment
```bash
# Install Heroku CLI and login
heroku create roadguard-backend
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_uri
# ... set other environment variables
git push heroku main
```

## 📊 Monitoring & Logging

- **Logging**: Winston logger with multiple transport levels
- **Error Tracking**: Comprehensive error handling middleware
- **Performance**: Request/response logging
- **Security**: Rate limiting and security headers

## 🔒 Security Features

- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Mongoose ODM
- **XSS Protection**: Helmet middleware
- **CORS**: Configurable origins
- **Rate Limiting**: Express rate limit
- **Password Hashing**: bcryptjs
- **JWT Security**: Access/refresh token pattern

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and queries:
- Email: support@roadguard.com
- Documentation: [API Docs](http://localhost:4000/api-docs)
- Issues: GitHub Issues

## 🎯 Hackathon Ready!

This backend is specifically designed for hackathon demonstrations:

- ✅ Complete demo data with realistic scenarios
- ✅ All major features implemented and tested
- ✅ Comprehensive API documentation
- ✅ Real-time features for impressive demos
- ✅ Easy setup with one-command seeding
- ✅ Production-grade security and architecture

**Perfect for impressing judges with a full-featured, scalable roadside assistance platform!**

---

Made with ❤️ for **RoadGuard** - *Your trusted roadside companion*
# team-38-DOMinators-Odoo-X-CGC
