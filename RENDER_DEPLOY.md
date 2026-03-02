## Render Deployment — Profile Service

### Architecture

| Service           | Render Type          | Why                                        |
| ----------------- | -------------------- | ------------------------------------------ |
| `profile-service` | **Private Service**  | gRPC-only, internal — no public URL needed |
| `gateway-service` | **Web Service**      | HTTP/REST public API                       |
| Postgres          | **Managed Postgres** | Render-hosted DB                           |

### Steps

#### 1. Create a Render Postgres Database

In the Render dashboard → **New → PostgreSQL**

- Name: `profile-db`
- After creation, copy the **Internal Database URL**

#### 2. Deploy Profile Service as a Private Service

In the Render dashboard → **New → Private Service**

- **Runtime**: Docker
- **Dockerfile Path**: `./Dockerfile.prod`
- **Root Directory**: `backend/profile-service` (if in a mono-repo)
- **Port**: `50051`

#### 3. Set Environment Variables on Render

| Key                          | Value                                   |
| ---------------------------- | --------------------------------------- |
| `DATABASE_URL`               | _(from Render Postgres → Internal URL)_ |
| `NODE_ENV`                   | `production`                            |
| `GRPC_HOST`                  | `0.0.0.0`                               |
| `PROFILE_SERVICE_PORT`       | `50051`                                 |
| `JWT_ACCESS_SECRET`          | _(your secret)_                         |
| `JWT_REFRESH_SECRET`         | _(your secret)_                         |
| `JWT_AUTH_SECRET`            | _(your secret)_                         |
| `FILES_SERVICE_PORT`         | `50052`                                 |
| `ADDRESS_SERVICE_PORT`       | `50053`                                 |
| `COMMUNICATION_SERVICE_PORT` | `50054`                                 |
| `ORGANIZATION_SERVICE_PORT`  | `50055`                                 |
| `FINANCIAL_SERVICE_PORT`     | `50056`                                 |
| `ADMIN_SERVICE_PORT`         | `50057`                                 |

#### 4. Internal URL (for gateway-service to connect)

Once deployed, other Render services connect via:

```
profile-service:50051
```

(Render's internal network — no public internet exposure)

#### 5. What the container does on start

1. Runs `prisma migrate deploy` (applies pending migrations)
2. Starts `node dist/main` (production gRPC server)
