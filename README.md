# LIC Policy & Customer Information Portal (DataStorage)

A full-stack, responsive web application for managing LIC (Life Insurance Corporation) policyholders, policy details, live camera photo capture, and fast searching. Ready to deploy on Vercel with Node.js Serverless API endpoints.

## 🚀 Key Features

1. **Serial Number-wise Data Table**: Automatically indexes customer records serially (`S.No. 1, 2, 3...`).
2. **Live Camera Click & Photo Upload**:
   - Integrated camera modal with live preview and photo capture (`Pic Click Karein`).
   - File upload option for document/customer images.
3. **Instant Search & Multi-Filter**: Search by Name, Serial Number, Policy Number, Phone, or Nominee. Filter by Policy Status & Plan type.
4. **Backend Serverless API & Persistence**: RESTful endpoints (`/api/policies`) for `GET`, `POST`, `PUT`, `DELETE`.
5. **Dashboard Summary**: Real-time stats on Total Policies, Active Policies, Due Soon, and Total Sum Assured.
6. **Data Export**: Export report to CSV/Excel or Print details directly.

---

## 🛠️ How to Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local server:
   ```bash
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## ☁️ How to Deploy on Vercel (Free 1-Click Deployment)

1. Go to [Vercel](https://vercel.com) and log in with your GitHub account.
2. Click **Add New** -> **Project**.
3. Import your GitHub repository:
   `https://github.com/utpalupadhyay/DataStorage`
4. Keep framework preset as **Other** (Root directory `./`).
5. Click **Deploy**.

Vercel will automatically detect `vercel.json` and deploy both your frontend and `/api/policies` serverless backend!

---

## 📁 Repository Structure

```
.
├── api/
│   └── policies.js          # Vercel Serverless API handler
├── index.html               # Main frontend user interface
├── style.css                # Custom responsive CSS styling
├── app.js                   # Client logic & API synchronization
├── server.js                # Express backend server for local dev
├── vercel.json              # Vercel deployment configuration
├── package.json             # Node.js dependencies
└── README.md                # Project documentation
```

Created by **Utpal Upadhyay**.
