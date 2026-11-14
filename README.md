# Cake Delight - Cloud Native Microservices Application

**Capstone Project:** Cloud Native Microservices Engineering  
**Candidate Name:** Polipireedi Rohith Kumar  
**Target Role:** Advanced Application Software Engineer (AASE)  
**Company:** Accenture  

---

## 1. Project Overview

**Cake Delight** is an enterprise-grade, cloud-native microservices application designed around the **12-Factor App methodology**. It provides an end-to-end e-commerce customer journey: browsing artisan cakes, applying multi-attribute filters, managing shopping cart operations, completing checkout, processing asynchronous notifications, and submitting customer reviews.

The solution addresses core engineering concerns expected of an **Advanced Application Software Engineer**:
- **Domain-Driven Service Boundaries:** 4 core business microservices + 1 API Gateway.
- **Database-per-Service Pattern:** Isolated, service-owned persistence stores.
- **Loose Coupling & Event-Driven Architecture:** Asynchronous order confirmation event processing.
- **Resilience & Fault Tolerance:** Automatic fallback handling and Kubernetes health probes.
- **Containerization & Orchestration:** Lightweight Docker packaging and production-ready Kubernetes manifests.

---

## 2. Microservices Architecture

```
                    +--------------------------------+
                    |    Client Browser / Web UI     |
                    +--------------------------------+
                                   | (Port 3000)
                                   v
                    +--------------------------------+
                    |       API Gateway (:3000)      |
                    |    Reverse Proxy & Routing     |
                    +--------------------------------+
                      /            |            \
                     /             |             \
       /api/catalog /   /api/order |   \api/rating\
                   v               v               v
            +------------+  +------------+  +------------+
            |  Catalog   |  |   Order    |  |   Rating   |
            |  Service   |  |  Service   |  |  Service   |
            |  (:3001)   |  |  (:3002)   |  |  (:3003)   |
            +------------+  +------------+  +------------+
                                   |
                                   | Order Completed Event (Async)
                                   v
                            +------------+
                            |Notification|
                            |  Service   |
                            |  (:3004)   |
                            +------------+
```

---

## 3. Microservices Summary

| Microservice | Port | Key Responsibilities | Primary Endpoints |
|---|---|---|---|
| **API Gateway** | `3000` | Single entry point, reverse proxy routing, hosts Client Web UI | `/*`, `/api/*`, `/health` |
| **Cake Catalog** | `3001` | Product catalog, multi-attribute filtering (name, category, price) | `GET /cakes`, `GET /cakes/:id`, `GET /categories` |
| **Order & Basket** | `3002` | Shopping basket operations, order checkout, event publishing | `GET /basket`, `POST /basket/items`, `POST /checkout`, `GET /orders` |
| **Rating Service** | `3003` | Customer reviews, dynamic average score calculation | `POST /ratings`, `GET /ratings/:cakeId` |
| **Notification** | `3004` | Event listener, order confirmation processing, delivery logging | `POST /events/order-completed`, `GET /notifications` |

---

## 4. How to Run the Application

### Option A: Local Execution (Recommended for Live Demo)
```bash
# 1. Start all microservices concurrently
npm start

# 2. Open Web Application
http://localhost:3000
```

### Option B: Docker Compose
```bash
# Build and run all microservice containers
docker compose up --build
```

### Option C: Kubernetes Deployment
```bash
# Apply namespace, deployments, and services
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

---

## 5. End-to-End Live Demonstration Script

Follow these 5 steps during your technical evaluation:

1. **Catalog & Filtering (`:3001`):**
   - Open `http://localhost:3000`.
   - Select **"Chocolate"** in the category dropdown or search by name.
   - *Technical highlight:* The request is routed via the API Gateway to the Catalog Microservice, which evaluates filters in-memory.

2. **Basket Operations (`:3002`):**
   - Click **`+ Add`** on cakes to populate the cart.
   - *Technical highlight:* Demonstrates state management inside the Order Microservice with real-time recalculation of subtotal, delivery fee, and grand total.

3. **Checkout & Event Publishing (`:3002`):**
   - Click **`Complete Checkout`**.
   - An order is generated with status `CONFIRMED` and unique ID `ORD-...`.
   - *Technical highlight:* The Order Service finishes checkout and dispatches an asynchronous `ORDER_COMPLETED` event.

4. **Event Consumption & Notification (`:3004`):**
   - View the **Event Notifications** card on the bottom-right.
   - The notification is received with delivery status `DELIVERED`.
   - *Technical highlight:* Demonstrates asynchronous decoupling; checkout latency is not dependent on notification dispatch.

5. **Rating & Feedback (`:3003`):**
   - Enter Cake ID `c1`, select a rating score, and click **`Submit Rating`**.
   - Click **`View Average`** to see dynamic recalculation.
   - *Technical highlight:* Demonstrates independent data persistence and mathematical aggregation.

---

## 6. Automated Testing Suite

Verify all service contracts and end-to-end flows:
```bash
npm run test:e2e
```
- **Test 1:** Health check probes across all 5 services.
- **Test 2:** Catalog search and multi-criteria filter validation.
- **Test 3:** Basket add, quantity update, and total calculations.
- **Test 4:** Checkout execution and order persistence.
- **Test 5:** Asynchronous notification delivery verification.
- **Test 6:** Rating submission and average calculation.
