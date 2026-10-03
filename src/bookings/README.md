# Bookings Module

This module handles class and trainer bookings with capacity checks, double-booking prevention, and cancellation features.

## Entities

### ClassBookingEntity
- `id`: Primary key
- `memberId`: Foreign key to members.id
- `classId`: String identifier of the class
- `className`: Name of the class
- `date`: Booking date (YYYY-MM-DD format)
- `timeSlot`: Time slot (e.g., "09:00-10:00")
- `status`: pending | confirmed | cancelled
- `createdAt`: Timestamp

### TrainerBookingEntity
- `id`: Primary key
- `memberId`: Foreign key to members.id
- `trainerId`: String identifier of the trainer
- `trainerName`: Name of the trainer
- `date`: Booking date (YYYY-MM-DD format)
- `startTime`: Start time (HH:mm format)
- `duration`: Duration in minutes
- `hourlyRate`: Trainer's hourly rate
- `totalAmount`: Calculated total (duration/60 * hourlyRate)
- `status`: pending | confirmed | cancelled
- `notes`: Optional notes (nullable)
- `createdAt`: Timestamp

## API Endpoints

All endpoints require JWT authentication (`Authorization: Bearer <token>`)

### POST /api/bookings/class
Create a class booking.

**Request Body:**
```json
{
  "classId": "yoga-101",
  "className": "Yoga Basics",
  "date": "2024-12-25",
  "timeSlot": "09:00-10:00"
}
```

**Response (201):**
```json
{
  "id": 1,
  "memberId": 5,
  "classId": "yoga-101",
  "className": "Yoga Basics",
  "date": "2024-12-25",
  "timeSlot": "09:00-10:00",
  "status": "confirmed",
  "createdAt": "2024-12-20T10:30:00Z"
}
```

**Business Logic:**
- Capacity check: Max 25 bookings per class+date+timeSlot (excluding cancelled)
- Double-booking prevention: Member cannot book multiple classes at same date+time
- Throws `ConflictException` if class is full or member has conflicting booking

### POST /api/bookings/trainer
Create a trainer booking.

**Request Body:**
```json
{
  "trainerId": "trainer-123",
  "trainerName": "John Doe",
  "date": "2024-12-26",
  "startTime": "14:30",
  "duration": 60,
  "hourlyRate": 50,
  "notes": "Focus on strength training"
}
```

**Response (201):**
```json
{
  "id": 2,
  "memberId": 5,
  "trainerId": "trainer-123",
  "trainerName": "John Doe",
  "date": "2024-12-26",
  "startTime": "14:30",
  "duration": 60,
  "hourlyRate": 50,
  "totalAmount": 50,
  "status": "confirmed",
  "notes": "Focus on strength training",
  "createdAt": "2024-12-20T10:35:00Z"
}
```

**Business Logic:**
- Calculates `totalAmount = (duration / 60) * hourlyRate`
- Checks for overlapping trainer bookings on same date
- Throws `ConflictException` if trainer is not available

### GET /api/bookings/my-bookings
Get all bookings for the authenticated member.

**Response (200):**
```json
{
  "classBookings": [
    {
      "id": 1,
      "memberId": 5,
      "classId": "yoga-101",
      "className": "Yoga Basics",
      "date": "2024-12-25",
      "timeSlot": "09:00-10:00",
      "status": "confirmed",
      "createdAt": "2024-12-20T10:30:00Z"
    }
  ],
  "trainerBookings": [
    {
      "id": 2,
      "memberId": 5,
      "trainerId": "trainer-123",
      "trainerName": "John Doe",
      "date": "2024-12-26",
      "startTime": "14:30",
      "duration": 60,
      "hourlyRate": 50,
      "totalAmount": 50,
      "status": "confirmed",
      "notes": "Focus on strength training",
      "createdAt": "2024-12-20T10:35:00Z"
    }
  ]
}
```

**Sorting:** Results are sorted by date DESC, then createdAt DESC

### GET /api/bookings/:id?type=class|trainer
Get a specific booking by ID.

**Query Parameters:**
- `type`: Either "class" or "trainer" (required)

**Response (200):** Returns the booking object

**Business Logic:**
- Ownership check: Only the member who created the booking can view it
- Throws `NotFoundException` if booking doesn't exist
- Throws `ConflictException` if not owned by requesting member

### DELETE /api/bookings/:id?type=class|trainer
Cancel a booking.

**Query Parameters:**
- `type`: Either "class" or "trainer" (required)

**Response (200):**
```json
{
  "message": "Booking cancelled successfully"
}
```

**Business Logic:**
- Ownership check: Only the member who created the booking can cancel it
- Sets status to 'cancelled' (does not delete the record)
- Throws `BadRequestException` if already cancelled
- Throws `NotFoundException` if booking doesn't exist
- Throws `ConflictException` if not owned by requesting member

## Testing Examples

### Using curl (after obtaining JWT token from /api/auth/login)

```bash
# Set your JWT token
TOKEN="your_jwt_token_here"

# Create a class booking
curl -X POST http://localhost:3000/api/bookings/class \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "yoga-101",
    "className": "Yoga Basics",
    "date": "2024-12-25",
    "timeSlot": "09:00-10:00"
  }'

# Create a trainer booking
curl -X POST http://localhost:3000/api/bookings/trainer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trainerId": "trainer-123",
    "trainerName": "John Doe",
    "date": "2024-12-26",
    "startTime": "14:30",
    "duration": 60,
    "hourlyRate": 50
  }'

# Get my bookings
curl http://localhost:3000/api/bookings/my-bookings \
  -H "Authorization: Bearer $TOKEN"

# Get specific booking
curl "http://localhost:3000/api/bookings/1?type=class" \
  -H "Authorization: Bearer $TOKEN"

# Cancel booking
curl -X DELETE "http://localhost:3000/api/bookings/1?type=class" \
  -H "Authorization: Bearer $TOKEN"

# Test without auth (should return 401)
curl http://localhost:3000/api/bookings/my-bookings
```

## Validation

### CreateClassBookingDto
- `classId`: Required string
- `className`: Required string
- `date`: Must be valid date string (ISO 8601)
- `timeSlot`: Required string

### CreateTrainerBookingDto
- `trainerId`: Required string
- `trainerName`: Required string
- `date`: Must be valid date string (ISO 8601)
- `startTime`: Must match HH:mm format (e.g., "09:30", "14:00")
- `duration`: Number >= 30 (minimum 30 minutes)
- `hourlyRate`: Number >= 0
- `notes`: Optional string

## Error Handling

- `401 Unauthorized`: No JWT token or invalid token
- `400 Bad Request`: Invalid DTO or trying to cancel already-cancelled booking
- `404 Not Found`: Booking doesn't exist
- `409 Conflict`: 
  - Class is full (25 bookings reached)
  - Member has double-booking conflict
  - Trainer is not available (time overlap)
  - Access denied (not your booking)
