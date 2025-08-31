# Chat and Vehicle Management Features

## Overview

This document describes the implementation of two major features in the RoadGuard application:

1. **Vehicle Management System** - Allows customers to store and manage their vehicle information
2. **Real-time Chat System** - Enables communication between customers and mechanics

## Vehicle Management System

### Database Schema

The vehicle data is stored as a subdocument in the User model:

```javascript
const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 50 },
  type: { type: String, required: true, enum: ['car', 'motorcycle', 'truck', 'bus', 'other'] },
  make: { type: String, required: true, maxlength: 50 },
  model: { type: String, required: true, maxlength: 50 },
  year: { type: Number, required: true, min: 1900, max: currentYear + 1 },
  plate: { type: String, required: true, uppercase: true, maxlength: 20 },
  color: { type: String, maxlength: 30 },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });
```

### API Endpoints

#### Customer Vehicle Management

- `GET /api/customer/vehicles` - Get all vehicles for the current user
- `POST /api/customer/vehicles` - Add a new vehicle
- `PUT /api/customer/vehicles/:vehicleId` - Update a vehicle
- `DELETE /api/customer/vehicles/:vehicleId` - Delete a vehicle
- `PATCH /api/customer/vehicles/:vehicleId/default` - Set a vehicle as default

### Frontend Components

- **VehicleManagement.js** - Main page for managing vehicles
- **VehicleSelector.js** - Dropdown component for selecting vehicles
- Vehicle forms with validation and error handling

## Chat System

### Database Schema

#### Chat Model
```javascript
const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  serviceRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  messages: [messageSchema],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  isActive: { type: Boolean, default: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
```

#### Message Schema
```javascript
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 1000 },
  messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  fileUrl: { type: String },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, { timestamps: true });
```

### API Endpoints

#### Chat Management

- `GET /api/chat/conversations` - Get all conversations for the current user
- `GET /api/chat/conversations/:serviceRequestId` - Get or create conversation for a service request
- `GET /api/chat/conversations/:serviceRequestId/messages` - Get messages with pagination
- `POST /api/chat/conversations/:serviceRequestId/messages` - Send a new message
- `POST /api/chat/conversations/:serviceRequestId/read` - Mark messages as read

### Frontend Components

#### Core Chat Components

1. **ChatInterface.js** - Main chat interface with conversation list and message area
2. **ConversationList.js** - Displays all conversations with unread message counts
3. **ChatMessage.js** - Individual message component with sender info and timestamps

#### Chat Pages

- **Customer Chat** (`/customer/chat`) - Chat interface for customers
- **Mechanic Chat** (`/mechanic/chat`) - Chat interface for mechanics

### Features

#### Chat Features
- ✅ Real-time message sending and receiving
- ✅ Message read status tracking
- ✅ Unread message count badges
- ✅ Conversation list with last message preview
- ✅ Message timestamps and sender information
- ✅ Support for text, image, and file messages
- ✅ Automatic conversation creation for service requests
- ✅ Pagination for message history

#### Vehicle Features
- ✅ Add, edit, and delete vehicles
- ✅ Set default vehicle
- ✅ Vehicle type categorization (car, motorcycle, truck, bus, other)
- ✅ License plate validation
- ✅ Vehicle information storage (make, model, year, color)
- ✅ Vehicle selector component for service requests

## Implementation Details

### Backend Implementation

1. **Models**: Created Chat model with embedded message schema
2. **Controllers**: Implemented chatController with all CRUD operations
3. **Routes**: Added chat routes to the main application
4. **Validation**: Added message validation schemas
5. **Middleware**: Integrated with existing authentication and validation

### Frontend Implementation

1. **API Service**: Created chatApi.js for all chat-related API calls
2. **Components**: Built reusable chat components
3. **Pages**: Added chat pages to both customer and mechanic layouts
4. **Navigation**: Added chat links to sidebar navigation
5. **State Management**: Used React hooks for state management

### Security Features

- Authentication required for all chat endpoints
- User authorization (only participants can access conversations)
- Input validation and sanitization
- Rate limiting (inherited from existing middleware)

## Usage

### For Customers

1. Navigate to "Messages" in the sidebar
2. View all conversations with mechanics
3. Click on a conversation to start chatting
4. Send text messages, images, or files
5. View message read status

### For Mechanics

1. Navigate to "Messages" in the sidebar
2. View all conversations with customers
3. Click on a conversation to start chatting
4. Respond to customer inquiries
5. Share updates about service requests

### Vehicle Management

1. Navigate to "My Vehicles" in the customer sidebar
2. Add new vehicles with complete information
3. Edit existing vehicle details
4. Set a default vehicle for quick service requests
5. Delete vehicles (if not used in active requests)

## Testing

Run the test script to verify all features are working:

```bash
cd backend
node test-chat-feature.js
```

## Future Enhancements

### Chat System
- Real-time notifications using WebSockets
- Typing indicators
- Message reactions
- File upload with progress tracking
- Message search functionality
- Chat history export

### Vehicle System
- Vehicle photos
- Service history tracking
- Maintenance reminders
- Insurance information
- Multiple vehicle owners

## Technical Notes

- Chat conversations are automatically created when a service request is assigned to a mechanic
- Messages are paginated to handle large conversation histories
- Vehicle data is validated on both frontend and backend
- All chat operations require proper authentication and authorization
- The system supports multiple message types for enhanced communication
