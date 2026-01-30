# API Reference

This document describes the REST API endpoints for lofield.fm.

## Authentication

Most endpoints require authentication via Supabase Auth. The session cookie is automatically included with requests from the web client.

### Headers

For authenticated requests:

- Session cookie is managed by Supabase Auth
- No manual Authorization header needed for browser clients

### Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:

- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (authenticated but not allowed)
- `404` - Not Found
- `500` - Internal Server Error

---

## Public Endpoints

These endpoints do not require authentication.

### Explore Tracks

#### `GET /api/explore`

Fetch public tracks with optional filtering and pagination.

**Query Parameters:**

| Parameter | Type   | Default   | Description                                             |
| --------- | ------ | --------- | ------------------------------------------------------- |
| `genre`   | string | -         | Filter by genre                                         |
| `tags`    | string | -         | Comma-separated tag list                                |
| `bpm_min` | number | -         | Minimum BPM                                             |
| `bpm_max` | number | -         | Maximum BPM                                             |
| `sort`    | string | `popular` | Sort order: `newest`, `popular`, `most_liked`, `random` |
| `limit`   | number | 20        | Results per page (max 100)                              |
| `offset`  | number | 0         | Pagination offset                                       |

**Response:**

```json
{
  "tracks": [
    {
      "id": "uuid",
      "name": "Track Name",
      "current_code": "s(\"bd hh\").bank(\"RolandTR808\")",
      "bpm": 120,
      "genre": "House",
      "tags": ["deep", "minimal"],
      "ai_tags": ["electronic", "dance"],
      "plays": 42,
      "like_count": 5,
      "is_featured": false,
      "is_system": false,
      "created_at": "2024-01-15T12:00:00Z"
    }
  ],
  "total": 150,
  "genres": ["House", "Ambient", "Techno"],
  "tags": ["deep", "minimal", "chill"],
  "bpm_range": { "min": 60, "max": 180 }
}
```

#### `GET /api/explore/featured`

Get featured, trending, and recent tracks for homepage sections.

**Response:**

```json
{
  "featured": [...],
  "trending": [...],
  "recent": [...]
}
```

#### `POST /api/explore/play`

Increment play count for a track (rate-limited per user/IP).

**Request Body:**

```json
{
  "trackId": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "counted": true
}
```

---

## Authenticated Endpoints

These endpoints require a valid session.

### User Profile

#### `GET /api/profile`

Get current user's profile.

**Response:**

```json
{
  "id": "uuid",
  "username": "johndoe",
  "display_name": "John Doe",
  "bio": "Music producer",
  "avatar_url": null,
  "email": "john@example.com"
}
```

#### `PATCH /api/profile`

Update current user's profile.

**Request Body:**

```json
{
  "username": "johndoe",
  "display_name": "John Doe",
  "bio": "Music producer"
}
```

### Favorites

#### `GET /api/favorites`

Get current user's liked tracks.

**Response:**

```json
{
  "tracks": [...],
  "total": 5
}
```

### Track Likes

#### `GET /api/tracks/:id/like`

Check if current user has liked a track.

**Response:**

```json
{
  "liked": true
}
```

#### `POST /api/tracks/:id/like`

Like a track.

**Response:**

```json
{
  "success": true,
  "liked": true
}
```

#### `DELETE /api/tracks/:id/like`

Unlike a track.

**Response:**

```json
{
  "success": true,
  "liked": false
}
```

### Projects

#### `GET /api/projects`

List user's projects with track counts.

**Response:**

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "My Album",
      "track_count": 5,
      "created_at": "2024-01-15T12:00:00Z",
      "updated_at": "2024-01-20T14:30:00Z"
    }
  ]
}
```

#### `POST /api/projects`

Create a new project.

**Request Body:**

```json
{
  "name": "My New Project"
}
```

#### `GET /api/projects/:id`

Get a specific project.

#### `PATCH /api/projects/:id`

Update a project.

**Request Body:**

```json
{
  "name": "Updated Name"
}
```

#### `DELETE /api/projects/:id`

Delete a project and all its tracks.

### Tracks

#### `GET /api/tracks?projectId=:id`

List tracks in a project.

#### `POST /api/tracks`

Create a new track.

**Request Body:**

```json
{
  "projectId": "uuid",
  "name": "New Track",
  "currentCode": "s(\"bd hh\").bank(\"RolandTR808\")"
}
```

#### `GET /api/tracks/:id`

Get a specific track.

#### `PATCH /api/tracks/:id`

Update a track.

**Request Body:**

```json
{
  "name": "Updated Name",
  "current_code": "...",
  "privacy": "public",
  "genre": "House",
  "bpm": 120,
  "tags": ["deep", "minimal"]
}
```

#### `DELETE /api/tracks/:id`

Delete a track.

### Revisions

#### `GET /api/tracks/:id/revisions`

List revisions for a track.

#### `POST /api/tracks/:id/revisions`

Create a new revision (checkpoint).

**Request Body:**

```json
{
  "code": "...",
  "message": "Added bass line"
}
```

#### `GET /api/tracks/:id/revisions/:revisionId`

Get a specific revision.

### Recordings

#### `GET /api/tracks/:id/recordings`

List MIDI recordings for a track.

#### `POST /api/tracks/:id/recordings`

Save a new MIDI recording.

**Request Body:**

```json
{
  "name": "Take 1",
  "durationMs": 30000,
  "events": [...]
}
```

#### `DELETE /api/tracks/:id/recordings/:recordingId`

Delete a recording.

### Sharing

#### `POST /api/tracks/:id/share`

Generate a share link for a track.

**Response:**

```json
{
  "token": "abc123",
  "url": "https://lofield.fm/share/abc123"
}
```

#### `GET /api/share/:token`

Get track data from a share token.

### API Keys

#### `GET /api/api-keys`

Check if user has an API key configured.

**Response:**

```json
{
  "hasKey": true,
  "maskedKey": "sk-...abc"
}
```

#### `POST /api/api-keys`

Save an OpenAI API key.

**Request Body:**

```json
{
  "apiKey": "sk-..."
}
```

#### `DELETE /api/api-keys`

Delete saved API key.

#### `POST /api/validate-key`

Validate an API key before saving.

**Request Body:**

```json
{
  "apiKey": "sk-..."
}
```

### AI Chat

#### `POST /api/chat`

Send a message to the AI assistant.

**Request Body:**

```json
{
  "message": "Add a bass line",
  "trackId": "uuid",
  "currentCode": "...",
  "context": []
}
```

**Response:** Server-sent events (SSE) stream.

### Usage

#### `GET /api/usage`

Get current user's usage statistics.

**Response:**

```json
{
  "tokensUsed": 5000,
  "dailyTokenLimit": 100000,
  "requestsPerMinute": 20,
  "tier": "free"
}
```

---

## Admin Endpoints

These endpoints require admin privileges.

### Users

#### `GET /api/admin/users`

List all users with usage stats.

#### `PATCH /api/admin/users/:id`

Update user limits and tier.

#### `DELETE /api/admin/users/:id`

Clear abuse flags for a user.

### Stats

#### `GET /api/admin/stats`

Get platform statistics.

### Presets

#### `POST /api/admin/seed-presets`

Seed system preset tracks.
