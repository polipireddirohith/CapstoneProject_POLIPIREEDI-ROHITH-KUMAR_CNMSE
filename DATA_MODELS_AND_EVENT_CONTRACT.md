# Cake Delight - Data Models, Event Contract & API Specifications

**Capstone Domain:** Cloud Native Microservices Engineering  
**Project:** Cake Delight  
**Student:** Polipireedi Rohith Kumar  

---

## 1. Database Schema & Data Models (Database-per-Service)

In compliance with cloud-native microservices architecture, each microservice exclusively owns its schema and persistence layer.

### 1.1 Cake Catalog Service Data Model (`catalog-service`)
**Entity: `Cake`**
```json
{
  "id": "String (Primary Key, e.g. 'c1')",
  "name": "String (Cake product title)",
  "category": "String ('Chocolate' | 'Velvet' | 'Cheesecake')",
  "price": "Number (Price in INR, e.g. 450)",
  "availability": "Boolean (true = In Stock, false = Out of Stock)",
  "description": "String (Short sensory product description)",
  "image": "String (Image URL / reference)"
}
```

---

### 1.2 Order & Basket Service Data Model (`order-service`)
**Entity: `BasketItem`**
```json
{
  "cakeId": "String (Reference ID)",
  "name": "String (Item name snapshot)",
  "price": "Number (Unit price snapshot)",
  "quantity": "Number (Quantity ordered >= 1)",
  "image": "String (Thumbnail image URL)"
}
```

**Entity: `Order`**
```json
{
  "orderId": "String (Unique Primary Key, e.g. 'ORD-1715859200000')",
  "customerName": "String (Recipient full name)",
  "email": "String (Customer notification email)",
  "items": "Array<BasketItem> (Frozen order line items)",
  "subtotal": "Number (Sum of item prices * quantities)",
  "deliveryFee": "Number (Flat delivery charge = 50)",
  "total": "Number (subtotal + deliveryFee)",
  "status": "String ('CONFIRMED' | 'DELIVERING' | 'CANCELLED')",
  "createdAt": "ISO 8601 Timestamp"
}
```

---

### 1.3 Rating Service Data Model (`rating-service`)
**Entity: `Rating`**
```json
{
  "cakeId": "String (Target Cake ID, indexed)",
  "customerName": "String (Reviewer name)",
  "rating": "Number (Integer scale: 1 to 5)",
  "comment": "String (Feedback comment)",
  "createdAt": "ISO 8601 Timestamp"
}
```

**Derived Aggregate:**
```json
{
  "cakeId": "c1",
  "averageRating": 4.5,
  "totalReviews": 2,
  "reviews": [ ... ]
}
```

---

### 1.4 Notification Service Data Model (`notification-service`)
**Entity: `Notification`**
```json
{
  "id": "String (Unique Notification Key, e.g. 'notif-1715859200000')",
  "orderId": "String (Associated order identifier)",
  "recipientEmail": "String (Target email address)",
  "subject": "String (Notification headline)",
  "message": "String (Delivery & order status message)",
  "status": "String ('DELIVERED' | 'QUEUED' | 'FAILED')",
  "time": "String (Human-readable delivery time)"
}
```

---

## 2. Asynchronous Message / Event Contract

When an order checkout is completed, the **Order Microservice** publishes an event to the RabbitMQ broker on exchange/queue `cake_order_completed`.

### Event Topic / Queue: `cake_order_completed`
**Protocol:** AMQP 0-9-1 / JSON Payload  

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "OrderCompletedEvent",
  "type": "object",
  "required": ["eventType", "orderId", "customerName", "email", "total", "items", "timestamp"],
  "properties": {
    "eventType": {
      "type": "string",
      "enum": ["ORDER_COMPLETED"]
    },
    "orderId": {
      "type": "string",
      "pattern": "^ORD-[0-9]+$"
    },
    "customerName": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "total": {
      "type": "number",
      "minimum": 0
    },
    "items": {
      "type": "array",
      "items": { "type": "string" }
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

### Sample Event Payload:
```json
{
  "eventType": "ORDER_COMPLETED",
  "orderId": "ORD-1715859288123",
  "customerName": "Rohith Kumar",
  "email": "rohith@example.com",
  "total": 950,
  "items": [
    "Belgian Chocolate Truffle (x2)"
  ],
  "timestamp": "2026-11-16T12:00:00.000Z"
}
```

---

## 3. Microservices REST API Specification

| Microservice | Method | Endpoint | Description | Sample Request / Query |
|---|---|---|---|---|
| **API Gateway** | `GET` | `/health` | Gateway Liveness probe | None |
| **Catalog** | `GET` | `/api/catalog/cakes` | List & filter cakes | `?category=Chocolate&maxPrice=500&name=Truffle` |
| **Catalog** | `GET` | `/api/catalog/cakes/:id` | Get single cake details | `GET /api/catalog/cakes/c1` |
| **Catalog** | `GET` | `/api/catalog/categories` | Get category list | None |
| **Order** | `GET` | `/api/order/basket` | Get cart & calculated totals | None |
| **Order** | `POST` | `/api/order/basket/items` | Add cake to cart | `{"cakeId":"c1","name":"Truffle","price":450,"quantity":1}` |
| **Order** | `PUT` | `/api/order/basket/items/:id` | Update item quantity | `{"quantity": 3}` |
| **Order** | `DELETE`| `/api/order/basket/items/:id`| Remove single item | None |
| **Order** | `DELETE`| `/api/order/basket` | Clear all basket items | None |
| **Order** | `POST` | `/api/order/checkout` | Complete checkout & fire event | `{"customerName":"Rohith","email":"rohith@test.com"}` |
| **Order** | `GET` | `/api/order/orders` | View order history | None |
| **Rating** | `POST` | `/api/rating/ratings` | Submit review (1-5 stars) | `{"cakeId":"c1","rating":5,"customerName":"Rohith","comment":"Great!"}` |
| **Rating** | `GET` | `/api/rating/ratings/:cakeId`| Get reviews & average | `GET /api/rating/ratings/c1` |
| **Notification**| `GET`| `/api/notification/notifications` | View sent confirmations | None |
| **Notification**| `POST`| `/api/notification/events/order-completed` | Webhook fallback | Event payload |
