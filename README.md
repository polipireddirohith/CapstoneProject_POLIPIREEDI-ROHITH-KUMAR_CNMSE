# 🎂 Cake Delight - Microservices Application

**Cloud Native Microservices Engineering Capstone Project**  
**Student:** Polipireedi Rohith Kumar  

---

## 📌 1. Project Overview

**Cake Delight** is an e-commerce cake application built using a **Microservices Architecture**.  
Instead of one large monolithic program, it is split into **5 independent services**:

1. **API Gateway (`Port 3000`):** Single entry point for the browser. Routes requests to backend services.
2. **Cake Catalog Service (`Port 3001`):** Stores cakes and filters them by name, category, and price.
3. **Order & Basket Service (`Port 3002`):** Manages the cart, creates orders at checkout, and fires the order event.
4. **Rating Service (`Port 3003`):** Submits ratings (1–5 stars) and calculates the average rating.
5. **Notification Service (`Port 3004`):** Listens for order events and confirms delivery.

---

## 🏗️ 2. Architecture Diagram

```
                 [ Web Browser / Client ]
                            │
                            │ (Port 3000)
                            ▼
                  [ API Gateway :3000 ]
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
       [ Catalog :3001 ] [ Order :3002 ] [ Rating :3003 ]
                            │
                            │ (Order Completed Event)
                            ▼
                    [ Notification :3004 ]
```

---

## 🚀 3. How to Run the Project (Easiest Way)

### Step 1: Start All Services
Open PowerShell / Terminal in this project folder and run:
```bash
npm start
```

### Step 2: Open in Browser
Open: **`http://localhost:3000`**

---

## 🎬 4. Step-by-Step Demo Script (What to Show in Viva)

When professors ask you to show the demo, follow these **5 simple steps on screen**:

### Step 1: Show Catalog & Filter (Catalog Service :3001)
- Open `http://localhost:3000`.
- In the **Category dropdown**, select **"Chocolate"**.
- Point to the screen and say:  
  > *"Here you can see the catalog filtering in real time. The request goes to the Catalog Microservice on port 3001."*

### Step 2: Add to Basket (Order Service :3002)
- Click the **"+ Add"** button on **Chocolate Truffle** and **Red Velvet**.
- Show the right side under **"Shopping Basket"**.
- Point to the total and say:  
  > *"The Order Microservice on port 3002 manages cart items in its own database and calculates the total plus delivery fee."*

### Step 3: Complete Checkout & Trigger Event
- Click the red **"Complete Checkout"** button.
- You will see: `✅ Order ORD-... Confirmed! Total: ₹...`
- Say to the professor:  
  > *"When checkout completes, the Order Service creates an order record and publishes an asynchronous event."*

### Step 4: Show Live Notification (Notification Service :3004)
- Look at the **"Event Notifications"** box on the bottom right.
- You will see the new notification appear with `[Status: DELIVERED]`.
- Say to the professor:  
  > *"This proves loose coupling and event-driven architecture. The Notification Service on port 3004 consumed the order event and logged the confirmation without blocking checkout."*

### Step 5: Submit a Rating (Rating Service :3003)
- Under **Product Rating Service**, enter Cake ID: `c1`, pick `⭐⭐⭐⭐⭐ (5)`, and click **"Submit Rating"**.
- Click **"View Average"**.
- Say to the professor:  
  > *"The Rating Service on port 3003 stores reviews independently and calculates the updated average rating in real-time."*

---

## 🐳 5. Docker & Kubernetes Commands

### Run with Docker Compose:
```bash
docker compose up --build
```

### Deploy on Kubernetes:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

---

## 🧪 6. Automated Testing
Run all 6 end-to-end integration tests anytime:
```bash
npm run test:e2e
```
*(Tests Catalog, Basket, Checkout, Notifications, Ratings, and Health endpoints with 100% pass rate).*
