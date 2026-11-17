# THM LabTrack - Setup Guide

## Prerequisites
* Node.js installed
* PostgreSQL Database (e.g., Neon)
* Cloudinary Account

## Installation Steps
1. Extract the project ZIP file.
2. Open terminal in the project folder.
3. Run `npm install`
4. Copy `.env.example` to `.env` (`cp .env.example .env`)
5. Add your Database URL, Cloudinary keys, and NextAuth secret in `.env`.
6. Run `npx prisma generate`
7. Run `npx prisma migrate dev --name init`
8. Run `npm run db:seed` (Creates default Manager account)
9. Run `npm run dev`
10. Open http://localhost:3000
