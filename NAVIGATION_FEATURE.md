# Navigation Feature for Mechanics

## Overview
The navigation feature allows mechanics to easily get directions to customer locations after accepting service requests. This feature integrates with popular navigation apps and provides route information.

## Features

### 🗺️ Multi-App Navigation Support
- **Google Maps**: Opens with turn-by-turn directions
- **Apple Maps**: Native iOS/macOS navigation
- **Waze**: Community-based navigation with real-time updates

### 📍 Location Services
- **Automatic Location Detection**: Gets mechanic's current location if not provided
- **Distance Calculation**: Shows distance from mechanic to customer
- **Travel Time Estimation**: Estimates arrival time based on distance
- **Address Copy**: One-click copy of customer address to clipboard

### 🚗 Route Information
- **Real-time Distance**: Calculated using Haversine formula
- **Estimated Travel Time**: Based on average city speed (30 km/h)
- **Service Details**: Shows vehicle information and service type
- **Customer Contact**: Direct phone call integration

### 📱 User Interface
- **Modal Interface**: Clean, accessible navigation modal
- **Status Updates**: Mark request as "En Route" with one click
- **Quick Actions**: Fast access to common navigation tasks
- **Responsive Design**: Works on mobile and desktop

## Implementation Details

### Frontend Components

#### NavigationModal Component
- **Location**: `frontend/src/components/mechanic/NavigationModal.js`
- **Features**:
  - Route calculation and display
  - Multi-app navigation integration
  - Status update functionality
  - Address copying
  - Customer calling

#### Integration Points
- **AssignedRequests Page**: Navigation button for assigned/en route requests
- **Dashboard**: Quick navigation from recent requests
- **Request Details**: Navigation option in request management

### Backend Support

#### API Endpoints
- **Status Update**: `PATCH /api/mechanic/requests/{requestId}/status`
- **Request Details**: `GET /api/mechanic/requests/{requestId}`

#### Location Data Structure
```javascript
{
  lat: Number,      // Latitude
  lng: Number,      // Longitude
  address: String   // Human-readable address
}
```

### Helper Functions

#### Distance Calculation
```javascript
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  // Haversine formula implementation
  // Returns distance in kilometers
};
```

#### Time Estimation
```javascript
const formatDuration = (minutes) => {
  // Converts minutes to human-readable format
  // e.g., "45 min" or "1h 30min"
};
```

## Usage Flow

### 1. Accept Request
1. Mechanic accepts a service request
2. Request status changes to "assigned"

### 2. Access Navigation
1. Click "Navigate" button on assigned request
2. Navigation modal opens with route information

### 3. Get Directions
1. Choose preferred navigation app
2. App opens with customer location as destination
3. Follow turn-by-turn directions

### 4. Update Status
1. Click "Mark as En Route" when starting journey
2. Request status updates automatically
3. Customer receives notification

## Technical Features

### Geolocation Integration
- **Browser Geolocation API**: Automatic location detection
- **Fallback Handling**: Graceful error handling for location services
- **Permission Management**: User-friendly permission requests

### Navigation App Integration
- **Universal Links**: Direct app opening when available
- **Fallback URLs**: Web-based navigation as backup
- **Cross-Platform**: Works on iOS, Android, and desktop

### Real-time Updates
- **Socket Integration**: Live status updates
- **Customer Notifications**: Real-time status changes
- **Location Tracking**: Optional location sharing

## Security & Privacy

### Data Protection
- **Location Privacy**: Only shared when necessary
- **Secure API Calls**: Authenticated requests
- **Data Minimization**: Only required location data

### User Control
- **Permission-Based**: Location access requires user consent
- **Opt-out Options**: Users can disable location features
- **Data Retention**: Location data not stored unnecessarily

## Future Enhancements

### Planned Features
- **Real-time Location Sharing**: Live mechanic location updates
- **Route Optimization**: Multi-stop route planning
- **Traffic Integration**: Real-time traffic data
- **ETA Updates**: Dynamic arrival time updates

### Advanced Navigation
- **Offline Maps**: Offline navigation support
- **Custom Routes**: Preferred route selection
- **Landmark Integration**: Nearby landmark identification

## Troubleshooting

### Common Issues

#### Location Not Available
- **Check Permissions**: Ensure location access is granted
- **Browser Support**: Verify geolocation API support
- **Network Connection**: Check internet connectivity

#### Navigation Apps Not Opening
- **App Installation**: Verify navigation apps are installed
- **Default Apps**: Check default app settings
- **URL Schemes**: Ensure proper URL scheme handling

#### Route Calculation Errors
- **Location Data**: Verify location coordinates are valid
- **API Limits**: Check for rate limiting issues
- **Network Issues**: Ensure stable internet connection

## API Reference

### Navigation Modal Props
```javascript
NavigationModal({
  isOpen: Boolean,           // Modal visibility
  onClose: Function,         // Close handler
  request: Object,           // Service request data
  mechanicLocation: Object   // Mechanic's location
})
```

### Request Status Updates
```javascript
// Update request status
await mechanicApi.updateRequestStatus(requestId, { status: 'enroute' });
```

## Testing

### Manual Testing Checklist
- [ ] Navigation modal opens correctly
- [ ] Route calculation works accurately
- [ ] Navigation apps open properly
- [ ] Status updates function correctly
- [ ] Address copying works
- [ ] Customer calling works
- [ ] Location detection functions
- [ ] Error handling works properly

### Automated Testing
- Unit tests for distance calculation
- Integration tests for API calls
- E2E tests for navigation flow
- Accessibility testing for modal

## Performance Considerations

### Optimization
- **Lazy Loading**: Navigation modal loads on demand
- **Caching**: Route calculations cached when possible
- **Debouncing**: Location updates debounced to prevent spam
- **Minimal API Calls**: Efficient API usage

### Monitoring
- **Performance Metrics**: Track modal load times
- **Error Tracking**: Monitor navigation failures
- **Usage Analytics**: Track feature adoption
- **User Feedback**: Collect user experience data
