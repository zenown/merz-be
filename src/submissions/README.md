# Submissions Module

This module handles file submissions with uploads for stores and planograms.

## Entities

### Upload Entity
- `id` (UUID, PK)
- `filename` (string)
- `filesize` (string)
- `fileType` (string)
- `uploadedAt` (timestamp)
- `uploadedById` (UUID, FK to User)
- `storeId` (UUID, FK to Store)
- `planogramId` (UUID, FK to Planogram)
- `submissionId` (UUID, FK to Submission)

### Submission Entity
- `id` (UUID, PK)
- `uploadedAt` (timestamp)
- `uploadedById` (UUID, FK to User)
- `storeId` (UUID, FK to Store)
- `planogramId` (UUID, FK to Planogram)
- `uploadIds` (array of UUIDs, FK to Upload)

## API Endpoints

### Admin Endpoints (Requires ADMIN role)

#### GET /submissions
- List all submissions with filtering and sorting
- Query parameters:
  - `storeId`: Filter by store ID
  - `planogramId`: Filter by planogram ID
  - `uploadedById`: Filter by user ID
  - `search`: Search in submission fields
  - `sortBy`: Sort by field (uploadedAt, createdAt, updatedAt)
  - `sortOrder`: Sort order (ASC, DESC)

#### GET /submissions/:id
- Get submission by ID with populated relations

#### PUT /submissions/:id
- Update submission

#### DELETE /submissions/:id
- Delete submission

### User Endpoints (Requires USER or ADMIN role)

#### POST /submissions
- Create submission with file upload
- Body: multipart/form-data
  - `storeId`: Store ID (UUID)
  - `planogramId`: Planogram ID (UUID)
  - `file`: File to upload

#### POST /submissions/:id/uploads
- Add file upload to existing submission
- Body: multipart/form-data
  - `file`: File to upload

## Features

- File upload to S3 or local storage
- Automatic population of foreign key relations
- Role-based access control
- Search and filtering capabilities
- Support for multiple uploads per submission
