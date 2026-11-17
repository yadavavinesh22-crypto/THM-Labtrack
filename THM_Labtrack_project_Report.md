# PROJECT REPORT
## THM LabTrack
### TryHackMe Daily Lab Submission & Verification Management System

**Submitted by:** Avinesh
**Programme:** B.Tech — Cyber Security
**Prepared:** November 2026

## 1. Introduction and Problem Statement
THM LabTrack is designed for cybersecurity students to track their TryHackMe daily labs. It eliminates manual tracking by providing a centralized workflow with automated submission verification, image proof validation, and leaderboards.

## 2. Objectives and Scope
* Centralize lab submissions with Cloudinary-based image proof.
* Provide distinct roles: Student (submit, view points) and Manager (assign, verify, manage batches).
* Implement automated analytics, CSV reporting, and a points-based leaderboard.

## 3. Technology Stack
* **Next.js 14 (App Router):** Frontend and API logic.
* **TypeScript & Tailwind CSS:** Type safety and responsive UI.
* **Prisma ORM & PostgreSQL (Neon):** Database management.
* **Cloudinary:** Secure screenshot uploading.
* **NextAuth.js:** Authentication (Role-Based Access Control).

## 4. System Architecture
Users interact with the Next.js web app. NextAuth manages sessions. Prisma connects to the Neon PostgreSQL database. Images are securely hosted on Cloudinary, and rate limiting prevents API abuse.

## 5. Data Model and Workflow
* **User:** Roles (STUDENT/MANAGER), batch assignment.
* **Assignment:** Created by Manager, contains THM URL, deadline, and target batch.
* **Submission:** Links student work to an assignment (or custom lab). Includes Cloudinary URL, image hash (for duplicate detection), and status (PENDING/VERIFIED/REJECTED).

**Workflow:**
1. Manager creates/assigns a lab.
2. Student submits URL and screenshot proof.
3. Manager reviews and verifies/rejects.
4. Verified students earn points, updating the Leaderboard.

## 6. Security Considerations
* Passwords are hashed.
* Environment variables protect DB and API secrets.
* Role-Based Access Control ensures only managers can verify.
* Rate limiting prevents brute-force attacks.
* SHA-256 image hashing prevents duplicate screenshot fraud.

## 7. Testing and Deployment
| Test | What to verify | Actual Result |
| :--- | :--- | :--- |
| Login | Valid/Invalid credentials | **Pass** |
| Role access | Student vs Manager Dashboard | **Pass** |
| Assignment | Create, view, edit labs | **Pass** |
| Submission | URL and image upload (Cloudinary) | **Pass** |
| Review | Verify/Reject actions | **Pass** |
| Persistence | Data remains after refresh | **Pass** |
| Self-Practice | Uploading independent labs | **Pass** |

## 8. Conclusion
THM LabTrack successfully modernizes lab management with a secure, scalable, and user-friendly platform. (Real screenshots attached in Appendix).
