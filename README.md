# Test-task: comments

**Server-side NestJS application** for managing comments with file attachments and nested replies.

This API provides functionality for comment handling and includes:
- Creating new comments
- Adding sub-comments (nested replies)
- Attaching files to comments
- Storing attachments in AWS S3
- Validating CAPTCHA for comment submissions 
- Retrieving paginated comments and their nested structure
- Authenticate users using JWT tokens

---

## Requirements

You should have:
- AWS S3 Bucket:

## 🚀 Installation

- Make sure you have the following programs installed:
  
  1.Docker

  2.Docker Compose

### Clone the repository

```bash
git clone https://github.com/RikiBob/test-task-for-dzen-code.git
```
## Customizing Docker Compose

### If you need to customize the Docker Compose configuration, you can create a .env file in the project's root and adjust the variables according to your requirements.

Here is an example .env file:

### Example `.env` file

```env
# App
PORT=4000
FRONTEND_URL=localhost:3000

# Database (PostgreSQL)
DB_PORT_LOCAL=55432       # Host port (for developer access)
DB_PORT=5432              # Container internal port
DB_USERNAME=your-db-username
DB_HOST=your-db-host
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_ENTITIES=dist/**/*.entity.js
DB_MIGRATIONS=dist/migrations/*.js

# Redis
REDIS_PORT_LOCAL=16379    # Host port
REDIS_PORT=6379           # Container internal port
REDIS_HOST=your-redis-host
REDIS_USERNAME=your-redis-username
REDIS_PASSWORD=your-redis-password
REDIS_TTL_IN_REFRESH=2592000000

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN_ACCESS=30m
JWT_EXPIRES_IN_REFRESH=720h

# AWS S3 (replace with actual values)
AWS_S3_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_BUCKET_NAME=your-bucket-name

#Cookies
COOKIE_MAX_AGE_IN_ACCESS=1800000
COOKIE_MAX_AGE_IN_REFRESH=2592000000

# Session
SESSION_SECRET_KEY=your-session-secret

SWAGGER_LOGIN=admin
SWAGGER_PASSWORD=admin

NODE_ENV=development
```

## After setting up the .env file, run the following command in the project directory bash to start the project:

```bash
docker-compose up --build -d

docker-compose run --rm app npm run migration:run
```

## For stop running project in docker

```bash
docker-compose stop
```

## Swagger Integration

### Access Swagger UI

Visit Swagger UI:

Open your web browser and navigate to the Swagger UI endpoint. Endpoint is /api.

### Authentication

Authentication may be required for Swagger. If so, use the following credentials:

- Username: Value from the .env file (e.g., SWAGGER_LOGIN)
- Password: Value from the .env file (e.g., SWAGGER_PASSWORD)