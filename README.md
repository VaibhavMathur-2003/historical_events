# Historical Events Backend

##  Quickstart

1. **Clone the repository**
   ```bash
   git clone https://github.com/VaibhavMathur-2003/historical_events
   cd historical_events
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment**
   - Make `.env` and fill in your PostgreSQL credentials:
     ```env
     PG_HOST=localhost
     PG_PORT=5432
     PG_USER=your_user
     PG_PASSWORD=your_password
     PG_DATABASE=historical_events_db
     PORT=3000
     ```
4. **Initialize the database** (drops and recreates the DB, then sets up schema):
   ```bash
   node db/init.js
   ```
5. **Run the server**
   ```bash
   node server.js
   ```
   The API will be available at `http://localhost:3000/api`

---

## 🛠️ Detailed Setup Instructions

### Dependencies
- Node.js (v16+)
- PostgreSQL (v12+)
- npm (comes with Node.js)

### Installation & Configuration
1. **Install Node.js and PostgreSQL** if not already installed.
2. **Install project dependencies**: `npm install`
3. **Configure your environment**: Set up `.env` as shown above.
4. **Initialize the database**: `node db/init.js` (this will drop and recreate the DB each time).
5. **Start the server**: `node server.js` or `nodemon server.js`

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### 1. Ingest Events
**POST** `/events/ingest`
- **Body:**
  ```json
  {
    "filePath": "./sample.txt"
  }
  ```
- **Response:**
  ```json
  {
    "status": "Ingestion initiated",
    "jobId": "ingest-job-acf8ec62-df3b-4fb7-903a-352f91472cff",
    "message": "Check /api/events/ingestion-status/ingest-job-acf8ec62-df3b-4fb7-903a-352f91472cff for updates."
  }
  ```
- **Example:**
  ```bash
  curl -X POST http://localhost:3000/api/events/ingest \
    -H "Content-Type: application/json" \
    -d '{"filePath": "./sample.txt"}'
  ```

### 2. Ingestion Status
**GET** `/events/ingestion-status/:jobId`
- **Response:**
  ```json
  {
    "jobId": "ingest-job-acf8ec62-df3b-4fb7-903a-352f91472cff",
    "status": "COMPLETED",
    "processedLines": 27,
    "errorLines": 6,
    "totalLines": 33,
    "errors": [
      "Line 6: Invalid event_id format (must be UUID): 'malformed-id-1|Broken Event|2023-01-02T09:00:00Z|2023-01-02T10:00:00Z|NULL|5|Missing one field.'",
      "Line 7: Invalid event_id format (must be UUID): 'invalid-value|Negative Research Value|2023-04-01T09:00:00Z|2023-04-01T10:00:00Z|NULL|-2|Research value is negative.'",
      "Line 17: Invalid event_id format (must be UUID): 'duplicate-id|Duplicate ID Event|2023-04-02T09:00:00Z|2023-04-02T10:00:00Z|NULL|6|This ID will be duplicated below.'",
      "Line 20: Invalid event_id format (must be UUID): 'another-bad-line|Incorrect Date Format|2023/01/03 10:00|2023/01/03 11:00|NULL|4|Date not in ISO format.'",
      "Line 22: Invalid event_id format (must be UUID): 'just|a|few|fields|NULL|1|Too few fields.'",
      "Line 23: Invalid event_id format (must be UUID): 'duplicate-id|Another Duplicate ID Event|2023-04-02T11:00:00Z|2023-04-02T12:00:00Z|NULL|7|This ID is a duplicate.'"
    ],
    "startTime": "2025-07-08T06:28:44.185Z",
    "endTime": "2025-07-08T06:28:44.311Z",
    "summary": {
      "totalRecords": 27,
      "validRecords": 27,
      "duplicateRecords": 0,
      "successfulInsertions": 27,
      "failedInsertions": 0,
      "successfulParentUpdates": 12,
      "failedParentUpdates": 0,
      "invalidParentRecords": 0
    }
  }
  ```
- **Example:**
  ```bash
  curl http://localhost:3000/api/events/ingestion-status/ingest-job-acf8ec62-df3b-4fb7-903a-352f91472cff
  ```

### 3. Search Events
**GET** `/events/search`
- **Query Parameters:**
  - `name` (optional): Filter by event name
  - `start_date_after` (optional): ISO date
  - `end_date_before` (optional): ISO date
  - `sortBy` (optional): `event_name`, `start_date`, `end_date`, `duration_minutes`
  - `sortOrder` (optional): `asc`, `desc`
  - `page` (optional): Page number
  - `limit` (optional): Items per page
- **Response:**
  ```json
  {
    "totalEvents": 4,
    "page": 1,
    "limit": 5,
    "events": [
      {
        "event_id": "f7e6d5c4-b3a2-1098-7654-3210fedcba98",
        "event_name": "Phase 1 Research"
      },
      {
        "event_id": "5f6e7d8c-9a0b-1c2d-3e4f-5a6b7c8d9e0f",
        "event_name": "Analysis Phase Alpha"
      },
      {
        "event_id": "0d9e8f7a-6b5c-4d3e-2f1a-0b9c8d7e6f5a",
        "event_name": "Customer Onboarding Phase"
      },
      {
        "event_id": "e2f3a4b5-c6d7-e8f9-a0b1-c2d3e4f5a6b7",
        "event_name": "Phase 1 - Data Sourcing"
      }
    ]
  }
  ```
- **Example:**
  ```bash
  curl http://localhost:3000/api/events/search?name=phase&sortBy=start_date&sortOrder=asc&page=1&limit=5
  ```

### 4. Timeline
**GET** `/timeline/:rootEventId`
- **Response:**
  ```json
  {
    "event_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "event_name": "Founding of ArchaeoData",
    "description": "Initial establishment of the company",
    "start_date": "2023-01-01T10:00:00.000Z",
    "end_date": "2023-01-01T11:30:00.000Z",
    "duration_minutes": 90,
    "parent_id": null,
    "children": [
      {
        "event_id": "c8d7e6f5-a4b3-2109-8765-4321fedcba98",
        "event_name": "Pilot Project Alpha",
        "description": "First major data reconstruction pilot",
        "start_date": "2023-01-05T09:00:00.000Z",
        "end_date": "2023-01-05T17:00:00.000Z",
        "duration_minutes": 480,
        "parent_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "children": [
          {
            "event_id": "1a2b3c4d-5e6f-7890-1234-567890abcdef",
            "event_name": "Data Acquisition for Alpha",
            "description": "Collecting raw data for the Alpha project.",
            "start_date": "2023-01-05T09:00:00.000Z",
            "end_date": "2023-01-05T12:00:00.000Z",
            "duration_minutes": 180,
            "parent_id": "c8d7e6f5-a4b3-2109-8765-4321fedcba98",
            "children": []
          },
          {
            "event_id": "5f6e7d8c-9a0b-1c2d-3e4f-5a6b7c8d9e0f",
            "event_name": "Analysis Phase Alpha",
            "description": "Analyzing the collected data. (Gap between Acquisition and Analysis)",
            "start_date": "2023-01-05T13:00:00.000Z",
            "end_date": "2023-01-05T17:00:00.000Z",
            "duration_minutes": 240,
            "parent_id": "c8d7e6f5-a4b3-2109-8765-4321fedcba98",
            "children": []
          }
        ]
      },
      {
        "event_id": "f7e6d5c4-b3a2-1098-7654-3210fedcba98",
        "event_name": "Phase 1 Research",
        "description": "Early research on data fragmentation techniques.",
        "start_date": "2023-01-01T10:30:00.000Z",
        "end_date": "2023-01-01T11:00:00.000Z",
        "duration_minutes": 30,
        "parent_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "children": [
          {
            "event_id": "11223344-5566-7788-9900-aabbccddeeff",
            "event_name": "Internal Review Meeting",
            "description": "Reviewing initial research findings. (Overlaps with Phase 1 Research)",
            "start_date": "2023-01-01T10:45:00.000Z",
            "end_date": "2023-01-01T11:15:00.000Z",
            "duration_minutes": 30,
            "parent_id": "f7e6d5c4-b3a2-1098-7654-3210fedcba98",
            "children": []
          }
        ]
      }
    ]
  }
  ```
- **Example:**
  ```bash
  curl http://localhost:3000/api/timeline/a1b2c3d4-e5f6-7890-1234-567890abcdef
  ```

### 5. Overlapping Events
**GET** `/insights/overlapping-events`
- **Response:**
  ```json
  [
    {
      "overlappingEventPairs": [
        {
          "event_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          "event_name": "Founding of ArchaeoData",
          "start_date": "2023-01-01T10:00:00.000Z",
          "end_date": "2023-01-01T11:30:00.000Z"
        },
        {
          "event_id": "f7e6d5c4-b3a2-1098-7654-3210fedcba98",
          "event_name": "Phase 1 Research",
          "start_date": "2023-01-01T10:30:00.000Z",
          "end_date": "2023-01-01T11:00:00.000Z"
        }
      ],
      "overlap_duration_minutes": 30
    },
    {
      "overlappingEventPairs": [
        {
          "event_id": "01234567-89ab-cdef-0123-456789abcdef",
          "event_name": "System Upgrade",
          "start_date": "2023-01-06T10:30:00.000Z",
          "end_date": "2023-01-06T12:00:00.000Z"
        },
        {
          "event_id": "6a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d",
          "event_name": "Team Brainstorm Session",
          "start_date": "2023-01-06T10:00:00.000Z",
          "end_date": "2023-01-06T11:00:00.000Z"
        }
      ],
      "overlap_duration_minutes": 30
    },
    {
      "overlappingEventPairs": [
        {
          "event_id": "01234567-89ab-cdef-0123-456789abcdef",
          "event_name": "System Upgrade",
          "start_date": "2023-01-06T10:30:00.000Z",
          "end_date": "2023-01-06T12:00:00.000Z"
        },
        {
          "event_id": "22334455-6677-8899-aabb-ccddeeff0011",
          "event_name": "Security Audit",
          "start_date": "2023-01-06T11:30:00.000Z",
          "end_date": "2023-01-06T13:00:00.000Z"
        }
      ],
      "overlap_duration_minutes": 30
    },
    {
      "overlappingEventPairs": [
        {
          "event_id": "1a2b3c4d-5e6f-7890-1234-567890abcdef",
          "event_name": "Data Acquisition for Alpha",
          "start_date": "2023-01-05T09:00:00.000Z",
          "end_date": "2023-01-05T12:00:00.000Z"
        },
        {
          "event_id": "c8d7e6f5-a4b3-2109-8765-4321fedcba98",
          "event_name": "Pilot Project Alpha",
          "start_date": "2023-01-05T09:00:00.000Z",
          "end_date": "2023-01-05T17:00:00.000Z"
        }
      ],
      "overlap_duration_minutes": 180
    },
    {
      "overlappingEventPairs": [
        {
          "event_id": "5f6e7d8c-9a0b-1c2d-3e4f-5a6b7c8d9e0f",
          "event_name": "Analysis Phase Alpha",
          "start_date": "2023-01-05T13:00:00.000Z",
          "end_date": "2023-01-05T17:00:00.000Z"
        },
        {
          "event_id": "c8d7e6f5-a4b3-2109-8765-4321fedcba98",
          "event_name": "Pilot Project Alpha",
          "start_date": "2023-01-05T09:00:00.000Z",
          "end_date": "2023-01-05T17:00:00.000Z"
        }
      ],
      "overlap_duration_minutes": 240
    },
    {
      "overlappingEventPairs": [
        {
          "event_id": "11223344-5566-7788-9900-aabbccddeeff",
          "event_name": "Internal Review Meeting",
          "start_date": "2023-01-01T10:45:00.000Z",
          "end_date": "2023-01-01T11:15:00.000Z"
        },
        {
          "event_id": "f7e6d5c4-b3a2-1098-7654-3210fedcba98",
          "event_name": "Phase 1 Research",
          "start_date": "2023-01-01T10:30:00.000Z",
          "end_date": "2023-01-01T11:00:00.000Z"
        }
      ],
      "overlap_duration_minutes": 15
    },
    {
      "overlappingEventPairs": [
        {
          "event_id": "11223344-5566-7788-9900-aabbccddeeff",
          "event_name": "Internal Review Meeting",
          "start_date": "2023-01-01T10:45:00.000Z",
          "end_date": "2023-01-01T11:15:00.000Z"
        },
        {
          "event_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          "event_name": "Founding of ArchaeoData",
          "start_date": "2023-01-01T10:00:00.000Z",
          "end_date": "2023-01-01T11:30:00.000Z"
        }
      ],
      "overlap_duration_minutes": 30
    }
  ]
  ```
- **Example:**
  ```bash
  curl http://localhost:3000/api/insights/overlapping-events
  ```

### 6. Temporal Gaps
**GET** `/insights/temporal-gaps?startDate=...&endDate=...`
- **Query:** `startDate`, `endDate` (ISO format)
- **Response:** Largest gap and the events it is between.
  ```json
  {
    "largestGap": {
      "startOfGap": "2023-01-10T16:00:00.000Z",
      "endOfGap": "2023-01-15T09:00:00.000Z",
      "durationMinutes": 6780,
      "precedingEvent": {
        "event_id": "9b8a7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
        "event_name": "Marketing Campaign Launch",
        "end_date": "2023-01-10T16:00:00.000Z"
      },
      "succeedingEvent": {
        "event_id": "0d9e8f7a-6b5c-4d3e-2f1a-0b9c8d7e6f5a",
        "event_name": "Customer Onboarding Phase",
        "start_date": "2023-01-15T09:00:00.000Z"
      }
    },
    "message": "Largest temporal gap identified."
  }
  ```
- **Example:**
  ```bash
  curl http://localhost:3000/api/insights/temporal-gaps?startDate=2023-01-01T00:00:00Z&endDate=2023-01-20T00:00:00Z
  ```

### 7. Event Influence Path
**GET** `/insights/event-influence?sourceEventId=...&targetEventId=...`
- **Query:** `sourceEventId`, `targetEventId`
- **Response:** Shortest path (by duration) between two events.
  ```json
  {
    "sourceEventId": "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a",
    "targetEventId": "c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f1",
    "shortestPath": [
      {
        "event_id": "d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a",
        "event_name": "Project Gaia Initiation",
        "duration_minutes": 60
      },
      {
        "event_id": "a4b5c6d7-e8f9-a0b1-c2d3-e4f5a6b7c8d9",
        "event_name": "Algorithm Development",
        "duration_minutes": 480
      },
      {
        "event_id": "b5c6d7e8-f9a0-b1c2-d3e4-f5a6b7c8d9e0",
        "event_name": "Model Training",
        "duration_minutes": 960
      },
      {
        "event_id": "c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f1",
        "event_name": "Deployment Planning",
        "duration_minutes": 180
      }
    ],
    "totalDurationMinutes": 1680,
    "message": "Shortest temporal path found from source to target event."
  }
  ```
- **Example:**
  ```bash
  curl http://localhost:3000/api/insights/event-influence?sourceEventId=d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a&targetEventId=c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f1
  ```

---

##  Design Choices & Concepts

### 1. **Hierarchical Event Model**
- **Self-Referencing Foreign Key:**  
  Each event can reference another event as its parent (`parent_id`), allowing for tree-like structures and timelines. This supports both root events (with `parent_id = NULL`) and arbitrarily deep event hierarchies.
- **Recursive Timeline Construction:**  
  The timeline endpoint uses a recursive SQL query to fetch all descendants of a root event and builds a nested tree in memory for API responses.

### 2. **Asynchronous Ingestion**
- **Job-Based Processing:**  
  Each ingestion request spawns a background job with a unique job ID. The job tracks progress, errors, and summary stats, and can be polled for status.
- **Streaming File Processing:**  
  Large files are processed line-by-line using Node.js streams, minimizing memory usage.
- **Multi-Stage Validation:**  
  - **Field Count & Format:** Each line is checked for the correct number of fields and valid UUID/date formats.
  - Ensures end date is after start date, research value is numeric, and parent IDs exist in the batch.
  - **Deduplication:** Duplicate event IDs are detected and filtered out before DB insertion.
- **Topological Sort:**  
  Events are sorted so that parents are always inserted before their children, ensuring foreign key constraints are satisfied.
- **Transactional Safety:**  
  All inserts/updates are wrapped in a transaction. If no records are valid, the transaction is rolled back.

### 3. **Search & Query**
- **Filtering:**  
  Search endpoint supports filtering by name, date ranges, and sorting by multiple fields.

- **Dynamic SQL Construction:**  
  Query parameters are dynamically translated into SQL WHERE clauses, with safe parameterization to prevent injection.

### 4. **Temporal Insights & Analytics**
- **Overlapping Events:**  
  Uses SQL to efficiently find all pairs of events that overlap in time, returning both the event details and the overlap duration.
- **Temporal Gaps:**  
  Finds the largest gap between events within a date range, reporting the gap and the events it is between.
- **Influence Path (Graph Traversal):**  
  Builds an in-memory graph of event relationships and uses a shortest-path algorithm (Djkistra time-duration shortest path) to find the minimal-duration path between two events.

### 5. **Centralized Error Handling**
- **Middleware-Based:**  
  All errors are passed to a centralized Express error handler, which returns consistent JSON error responses.
- **Validation & DB Error Reporting:**  
  All validation and database errors are reported with context (line numbers, field names, etc.) to aid debugging.

### 6. **Modular, Maintainable Codebase**
- **Separation of Concerns:**  
  - **Routes:** Define API endpoints and delegate to controllers.
  - **Controllers:** Handle request/response logic and call services.
  - **Services:** Contain business logic, DB access, and algorithms.
  - **Utils:** Shared helpers for validation, job tracking, etc.
- **Easily Extensible:**  
  New endpoints or features can be added by creating new controllers/services without affecting existing code.

### 7. **Database Design**
- **Normalized Schema:**  
  All event data is stored in a single table with appropriate types and constraints.
- **Computed Columns:**  
  `duration_minutes` is automatically calculated from start/end dates.
- **Indexes:**  
  Indexes on start date, end date, parent ID, and metadata (GIN) ensure fast queries for all major use cases.
- **Extension Usage:**  
  Uses the `uuid-ossp` extension for UUID generation.


---
