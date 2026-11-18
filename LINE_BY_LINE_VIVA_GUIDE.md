# 🎤 Line-by-Line Viva Presentation Guide

This guide gives you the exact, simple words to explain each microservice in your viva without getting nervous or stuck.

---

## 1. Cake Catalog Service (`catalog-service/server.js` — 77 lines)

### What to tell the professor:
> *"Sir/Madam, the Catalog Microservice is responsible for managing cake products and search filters. It runs independently on port 3001."*

### Key Lines to Point at:
1. **Lines 11–48 (`let cakes = [...]`):**
   - *"Here is the in-memory product database. In microservices, this service owns this data exclusively. No other service can touch it directly."*
2. **Line 51 (`app.get('/health', ...)`):**
   - *"This is the health check endpoint required by Kubernetes to check if the Pod is alive."*
3. **Lines 54–62 (`app.get('/cakes', ...)`):**
   - *"This is our main catalog API. It uses JavaScript's `filter` method to filter cakes by name, category, or price range (`minPrice` / `maxPrice`)."*
4. **Lines 65–68 (`app.get('/cakes/:id', ...)`):**
   - *"Fetches details for a single selected cake by its ID using `cakes.find()`."*
5. **Lines 71–73 (`app.get('/categories', ...)`):**
   - *"Returns all unique categories dynamically using JavaScript's `Set`, so the frontend filter dropdown always stays in sync with the data."*

---

## 2. Order & Basket Service (`order-service/server.js` — 128 lines)

### What to tell the professor:
> *"The Order Microservice runs on port 3002. It manages shopping basket operations, calculates totals, creates orders during checkout, and publishes the order completion event."*

### Key Lines to Point at:
1. **Lines 10–11 (`let basket = []; let orders = [];`):**
   - *"We maintain the cart and order history in isolated memory — only this service can modify them directly."*
2. **Lines 17–26 (`initRabbitMQ()`) and Lines 29–45 (`publishOrderEvent()`):**
   - *"This is the Event-Driven Publisher. `initRabbitMQ` connects to the message broker at startup. When checkout completes, `publishOrderEvent` sends an `ORDER_COMPLETED` message to the RabbitMQ queue so the Notification Service is triggered asynchronously — this avoids slowing down the checkout response."*
3. **Lines 51–58 (`app.get('/basket', ...)`):**
   - *"Calculates the item count, subtotal, ₹50 delivery fee, and grand total using `reduce()`."*
4. **Lines 61–66 (`app.post('/basket/items', ...)`):**
   - *"Adds a cake to the basket. If the item is already present, it increments the quantity instead of adding a duplicate."*
5. **Lines 90–121 (`app.post('/checkout', ...)`):**
   - *"Generates a unique `ORD-...` ID using `Date.now()`, marks status as `CONFIRMED`, clears the basket, and triggers `publishOrderEvent()`."*

---

## 3. Rating Service (`rating-service/server.js` — 35 lines)

### What to tell the professor:
> *"The Rating Service runs on port 3003. It allows customers to submit 1-to-5 star reviews and computes the average score dynamically."*

### Key Lines to Point at:
1. **Lines 9–12 (`let ratings = [...]`):**
   - *"Pre-seeded with two sample reviews so the UI always has data to show on first load."*
2. **Lines 18–23 (`app.post('/ratings', ...)`):**
   - *"Accepts `cakeId`, star rating (1–5), reviewer name, and review comment, and saves it to the `ratings` list."*
3. **Lines 26–31 (`app.get('/ratings/:cakeId', ...)`):**
   - *"Calculates the average rating by summing all ratings for that cake using `reduce()` and dividing by `totalReviews`. The result is rounded to 1 decimal place using `.toFixed(1)`."*

---

## 4. Notification Service (`notification-service/server.js` — 62 lines)

### What to tell the professor:
> *"The Notification Service runs on port 3004. It demonstrates asynchronous event consumption. It listens for orders and simulates sending email/SMS confirmations."*

### Key Lines to Point at:
1. **Lines 15–28 (`recordNotification(event)`):**
   - *"Takes the incoming order event, builds a full in-app confirmation message with the customer name and total, and stores it with status `DELIVERED`."*
2. **Lines 31–46 (`startRabbitMQConsumer()`):**
   - *"Connects to the RabbitMQ queue `cake_order_completed`. Whenever a message arrives, it acknowledges (`ack`) it and calls `recordNotification()` to log and store the confirmation."*
3. **Lines 52–55 (`app.post('/events/order-completed', ...)`):**
   - *"A direct HTTP webhook fallback that guarantees notifications still work even if RabbitMQ is not installed during local testing."*

---

## 5. API Gateway (`api-gateway/server.js` — 28 lines)

### What to tell the professor:
> *"The API Gateway runs on port 3000. It is the single entry point for all frontend traffic. The browser never calls the individual microservice ports directly."*

### Key Lines to Point at:
1. **Line 11 (`app.use(express.static(...))`):**
   - *"Serves the single-page frontend web UI from the `public/` folder directly to the browser."*
2. **Lines 21–24 (the four `proxy(...)` lines):**
   - *"These 4 lines act as a reverse proxy. Any request to `/api/catalog` is forwarded to port 3001, `/api/order` to port 3002, `/api/rating` to port 3003, and `/api/notification` to port 3004."*

---

## 6. E2E Test File (`test-e2e.js` — 139 lines)

### What to tell the professor:
> *"This is an automated end-to-end verification script that tests all 6 capstone scenarios across all 5 microservices in a single run."*

### Key Lines to Point at:
1. **Lines 10–41 (`function request(...)`):**
   - *"A reusable HTTP helper using Node's built-in `http` module. Every test scenario calls this single function instead of repeating raw HTTP code."*
2. **Lines 44–63 (`SERVICES` array + `ensureServicesRunning()`):**
   - *"If the services are not already running externally, this boots all 5 microservices in-process. The service list is an array so adding a new service only requires one line."*
3. **Lines 70–79 (health check loop):**
   - *"Instead of 5 separate `request + console.log` calls, we loop over a `HEALTH_ENDPOINTS` array — this is DRY (Don't Repeat Yourself) principle in action."*
4. **Lines 115–121 (Checkout + destructuring):**
   - *"We destructure `{ data: { order } }` directly on the response so there's no intermediate variable needed."*

---

## 7. Docker & Kubernetes (`k8s/` and `Dockerfile`)

### What to tell the professor:
1. **Dockerfile:**
   - *"We use `node:20-alpine` because Alpine Linux is lightweight (under 150MB) and boots in seconds."*
2. **Kubernetes Deployments:**
   - *"We specified `replicas: 2` for high availability."*
   - *"We configured `/health` for Liveness (restarts if crashed) and Readiness (routes traffic only when ready) probes."*
3. **Kubernetes Services:**
   - *"Internal services use `ClusterIP` for private inter-service communication."*
   - *"The API Gateway uses `NodePort` (port 30080) so external users can access it from outside the cluster."*
