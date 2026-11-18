# Cake Delight - Cloud Native Microservices Application

## 1. Project Overview

**Cake Delight** is a cloud-native microservices application that delivers an end-to-end cake e-commerce experience. It is built following the **12-Factor App methodology** and core enterprise engineering principles.

**Customer Journey Supported:**
- Browse cakes and apply filters (name, category, price)
- Add items to shopping basket and manage quantities
- Complete checkout and receive order confirmation
- Submit ratings and view average scores
- Receive asynchronous order notification events

**Key Engineering Principles Demonstrated:**
| Principle | Implementation |
|---|---|
| Service Boundaries | 4 independent business microservices + API Gateway |
| Database-per-Service | Each service owns its isolated in-memory data store |
| Loose Coupling | Asynchronous event-driven notification via HTTP event webhook |
| Fault Tolerance | Checkout succeeds even if Notification Service is slow |
| Containerization | Docker with lightweight Alpine Linux base image |
| Orchestration | Kubernetes Deployments, ClusterIP and NodePort Services |
| Health Monitoring | `/health` endpoints on every service |

---

## 2. Architecture Diagram

```
         +----------------------------------+
         |    Client Browser / Web UI       |
         +----------------------------------+
                         |
                    Port 3000
                         |
         +----------------------------------+
         |         API Gateway              |
         |   (Reverse Proxy + Web Server)   |
         +----------------------------------+
              |          |          |
        /api/catalog  /api/order  /api/rating  /api/notification
              |          |          |                |
       +--------+  +--------+  +--------+     +----------+
       |Catalog |  | Order  |  | Rating |     |Notif     |
       |:3001   |  | :3002  |  | :3003  |     |:3004     |
       +--------+  +--------+  +--------+     +----------+
                       |                           ^
                       |   ORDER_COMPLETED event   |
                       +---------------------------+
                            (Async HTTP Event)
```

---

## 3. Services & API Endpoints

### API Gateway (Port 3000)
| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Gateway health status |
| `GET` | `/` | Serves Web UI dashboard |
| `ANY` | `/api/catalog/*` | Forwards to Catalog Service |
| `ANY` | `/api/order/*` | Forwards to Order Service |
| `ANY` | `/api/rating/*` | Forwards to Rating Service |
| `ANY` | `/api/notification/*` | Forwards to Notification Service |

### Cake Catalog Service (Port 3001)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/cakes` | List cakes (supports `?name=`, `?category=`, `?minPrice=`, `?maxPrice=`) |
| `GET` | `/cakes/:id` | Get single cake by ID |
| `GET` | `/categories` | Get all unique categories |

### Order & Basket Service (Port 3002)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/basket` | View basket items and totals |
| `POST` | `/basket/items` | Add cake to basket |
| `DELETE` | `/basket/items/:cakeId` | Remove item from basket |
| `DELETE` | `/basket` | Clear entire basket |
| `POST` | `/checkout` | Create order and trigger notification event |
| `GET` | `/orders` | View order history |

### Rating Service (Port 3003)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/ratings` | Submit rating (1–5 stars) |
| `GET` | `/ratings/:cakeId` | Get reviews and average score for a cake |

### Notification Service (Port 3004)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/events/order-completed` | Receive order completed event |
| `GET` | `/notifications` | View all notification logs |

---

## 4. Order Completion Event Contract

When checkout succeeds, the Order Service sends this event payload to the Notification Service:

```json
{
  "orderId": "ORD-1731604500000",
  "customerName": "Rohith Kumar",
  "total": 950,
  "status": "CONFIRMED"
}
```

The Notification Service responds by logging a `DELIVERED` confirmation record.

---

## 5. Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Containerization | Docker (Alpine Linux) |
| Orchestration | Kubernetes |
| Local Dev | npm + run-local.js |
| Multi-container | Docker Compose |

---

## 6. How to Run

### Option A — Local 
```bash
npm run install:all    # Install dependencies across all services
npm start              # Start all 5 services concurrently
```
Open browser: `http://localhost:3000`

### Option B — Docker Compose
```bash
docker compose up --build
```

### Option C — Kubernetes
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
kubectl port-forward svc/api-gateway 3000:3000
```

---

## 7. Project Structure

```
├── api-gateway/            # Port 3000 — Reverse proxy + Web UI
│   ├── server.js
│   ├── public/index.html
│   └── Dockerfile
├── catalog-service/        # Port 3001 — Cake catalog and filtering
│   ├── server.js
│   └── Dockerfile
├── order-service/          # Port 3002 — Basket, checkout, event dispatch
│   ├── server.js
│   └── Dockerfile
├── rating-service/         # Port 3003 — Ratings and average calculation
│   ├── server.js
│   └── Dockerfile
├── notification-service/   # Port 3004 — Order event consumer
│   ├── server.js
│   └── Dockerfile
├── k8s/                    # Kubernetes manifests
│   ├── namespace.yaml
│   ├── catalog.yaml
│   ├── order.yaml
│   ├── rating.yaml
│   ├── notification.yaml
│   ├── gateway.yaml
│   └── rabbitmq.yaml
├── docker-compose.yml
├── run-local.js            # Starts all services concurrently
├── test-e2e.js             # End-to-end automated test suite
└── README.md
```

---

## 8. Automated Test Results

Run with:
```bash
npm run test:e2e
```

```
1. Health Checks       — API Gateway, Catalog, Order, Rating, Notification: UP
2. Catalog Filtering   — Filter by Category=Chocolate, MaxPrice=500: PASS
3. Basket Operations   — Add items, recalculate totals: PASS
4. Checkout            — Order created with status CONFIRMED: PASS
5. Notification Event  — ORDER_COMPLETED event consumed, status DELIVERED: PASS
6. Rating Aggregation  — 5-star rating submitted, average recalculated: PASS

All 6 tests passed.
```
