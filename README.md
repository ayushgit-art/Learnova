# 🎓 Learnova — Modern Full-Stack Learning Management System (LMS)

**Learnova** is a production-ready, full-stack e-learning platform that bridges the gap between students, educators, and administrators. Built on a modern MERN architecture, it delivers seamless video learning, dynamic course authoring, secure Stripe checkout, automated role-based access control, and an administrative quality-review pipeline.

---

## 🌟 Key Highlights & Feature Suite

### 1. 🎓 Student Experience
- **Course Discovery & Filtering:** Live keyword search, category navigation, and active filter tags.
- **Rich Course Previews:** In-depth syllabus breakdown, rich-text overview, educator credentials, and free preview lecture playback via embedded YouTube player.
- **Dedicated Learning Player:** Distraction-free lecture player with collapsible chapter navigation, automated duration calculations, and active lecture tracking.
- **Progress Tracking & Ratings:** Interactive "Mark Complete" lecture progression, visual course completion meters (`rc-progress`), and 5-star student review submissions.
- **My Enrollments Dashboard:** Centralized student hub displaying progress status, lecture counters, and one-click resumption.

### 2. 👨‍🏫 Educator Hub
- **Self-Service Onboarding:** Dedicated `/become-educator` workflow collecting credentials, experience, and LinkedIn profile to elevate user privileges.
- **Analytics & Earnings Dashboard:** Real-time metrics tracking total student enrollments, published courses, and net revenue.
- **Course Creation Studio:**
  - Rich-text course descriptions powered by Quill.
  - Drag-and-drop course thumbnail uploads with direct Cloudinary CDN hosting.
  - Multi-chapter curriculum builder with dynamic lecture reordering, free preview flags, and custom durations.
- **Course Management:** Course lifecycle monitoring with live review statuses (`Pending`, `Approved`, `Rejected`), rejection feedback inspection, and deletion guardrails.

### 3. 🛡️ Admin Quality Governance
- **Centralized Review Portal (`/admin`):** Moderation queue to inspect submitted course content, chapters, pricing, and educator credentials before publishing.
- **Quality Control Actions:** One-click approval to publish courses live to the catalog, or rejection with custom feedback reasons for instructor revisions.

### 4. ⚡ Core Architecture & Engineering Highlights
- **Role-Based Access Control (RBAC):** Synchronized permission model combining Clerk User Metadata and MongoDB schemas (`student`, `educator`, `admin`).
- **Resilient Payment Lifecycle:** Stripe Checkout integration backed by webhooks (`payment_intent.succeeded`) and an automated client-side redirect verification fallback.
- **Graceful Fallbacks:** Built-in seed data and on-the-fly MongoDB user synchronization ensuring zero-friction local development even before webhooks are wired.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Google Font (`Outfit`), React Router v7 |
| **Frontend Utilities** | Quill Editor, React-YouTube, RC-Progress, Humanize-Duration, React-Toastify, Axios, Uniqid |
| **Backend** | Node.js, Express 5 (ES Modules), Mongoose, Multer |
| **Authentication** | Clerk (`@clerk/express`, `@clerk/clerk-react`) |
| **Payment Gateway** | Stripe SDK (Checkout Sessions, Payment Intents & Webhook verification) |
| **Media & Storage** | Cloudinary v2 (Thumbnail storage & CDN delivery) |
| **Database** | MongoDB Atlas |
| **Deployment** | Vercel (Configured with SPA rewrites and serverless Node runtime) |

---

## 📁 Repository Structure

```plaintext
Project2.1/
├── client/                     # Frontend Vite + React application
│   ├── src/
│   │   ├── assets/             # Vector icons, brand logos & dummy datasets
│   │   ├── components/         # Reusable UI widgets
│   │   │   ├── educator/       # Educator Navbar, Sidebar & Footer
│   │   │   └── student/        # Navbar, Hero, CourseCard, Rating, Player, etc.
│   │   ├── context/            # Global AppContext (auth, state, calculations)
│   │   └── pages/
│   │       ├── admin/          # Admin approval dashboard
│   │       ├── educator/       # AddCourse, Dashboard, MyCourses, StudentsEnrolled
│   │       └── student/        # Home, CourseList, CourseDetails, Player, MyEnrollments
│   └── vercel.json             # Frontend SPA routing configuration
│
├── server/                     # Backend Node.js + Express API
│   ├── configs/                # MongoDB, Cloudinary & Multer upload configurations
│   ├── controllers/            # admin, course, educator, user & webhook handlers
│   ├── middlewares/            # protectEducator & protectAdmin authorization
│   ├── models/                 # User, Educator, Course, Purchase & CourseProgress schemas
│   ├── routes/                 # adminRoutes, courseRoute, educatorRoutes, userRoutes
│   ├── server.js               # Application entry point & route registration
│   └── vercel.json             # Backend serverless deployment configuration
│
└── SPEC.md                     # Full architectural specification & API blueprints
```

---

## 📡 Key API Endpoints

| Resource | Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Courses** | `GET` | `/api/course/all` | Public | List approved & published courses |
| **Courses** | `GET` | `/api/course/:id` | Public | Course details & preview lectures |
| **Courses** | `GET/POST`| `/api/course/seed` | Public | Seed default curriculum into database |
| **User** | `GET` | `/api/user/data` | Authenticated | Fetch synced profile & roles |
| **User** | `GET` | `/api/user/enrolled-courses` | Authenticated | List user-enrolled courses |
| **User** | `POST` | `/api/user/purchase` | Authenticated | Initiate Stripe checkout session |
| **User** | `POST` | `/api/user/verify-purchase` | Authenticated | Post-checkout session verification |
| **User** | `POST` | `/api/user/update-course-progress` | Authenticated | Track completed lectures |
| **User** | `POST` | `/api/user/add-rating` | Authenticated | Submit 1–5 star course rating |
| **Educator**| `POST` | `/api/educator/register` | Authenticated | Onboard educator profile & metadata |
| **Educator**| `POST` | `/api/educator/add-course` | Educator | Create course with Cloudinary image |
| **Educator**| `GET` | `/api/educator/courses` | Educator | List educator's owned courses |
| **Educator**| `GET` | `/api/educator/dashboard` | Educator | Overview stats (earnings, students) |
| **Educator**| `DELETE`| `/api/educator/delete-course/:id` | Educator | Delete un-enrolled course |
| **Admin** | `GET` | `/api/admin/courses` | Admin | Review pending/all submitted courses |
| **Admin** | `POST` | `/api/admin/approve-course` | Admin | Approve and publish course |
| **Admin** | `POST` | `/api/admin/reject-course` | Admin | Reject course with structured reason |

---
