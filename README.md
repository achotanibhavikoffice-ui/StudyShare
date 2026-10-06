# StudyShare - Campus Resource Sharing Portal

React (Vite) + Node.js/Express + MongoDB (Mongoose) + JWT auth + Cloudinary (optional; falls back to local disk).

## Run (two terminals)
Terminal 1 - API
    cd server
    npm install
    cp .env.example .env        (Windows: copy .env.example .env)
    # set JWT_SECRET in .env; leave MONGO_URI empty for a quick demo with mock data
    npm run dev                 -> http://localhost:5000/api/health

Terminal 2 - Website
    cd client
    npm install
    npm run dev                 -> http://localhost:5173

Data is saved in server/.data/db when MONGO_URI is empty, so accounts survive restarts.
To start fresh, stop the server and delete server/.data and server/uploads, or run: npm run seed (only with Atlas).

## Demo logins
jiya@demo.dev / password123  (also aarav@demo.dev, diya@demo.dev)
admin@studyshare.dev / admin123

## MongoDB Atlas
Set MONGO_URI in server/.env (include /studyshare as the database name), then run: npm run seed

## Cloudinary
Fill CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET in server/.env and restart.
/api/health shows "cloudinary": true when active. Files are limited to 10 MB.
