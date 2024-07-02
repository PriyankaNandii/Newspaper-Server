Newspaper FullStack Website
Project Overview
The Newspaper FullStack Website aims to revolutionize how users consume news by providing a comprehensive news aggregation platform. It offers trending articles, premium features, and a seamless user experience. Users can read articles, and subscribe for premium content, and authors can publish and manage their articles through a user-friendly interface.

Features
Dynamic Homepage: Includes trending articles slider, publisher listings, statistics, and subscription plans.
User Authentication: Email/password authentication and social login options (e.g., Google).
Admin Dashboard: Provides admin-specific functionalities like managing users, articles, and publishers.
Technology Used
Frontend: React, React Router
Backend: Node.js, Express, MongoDB for database, Firebase for file storage and authentication
Additional: Tailwind for UI components, React-Select for dropdowns, SweetAlert for notifications
Authentication: Firebase
Deployment: Vercel
Running Locally
To run this project locally, follow these steps:

Clone the repository:
git clone https://github.com/your/repository.git
cd repository-name
Install dependencies for both frontend and backend:
cd client npm install cd ../server npm install 3. Set up environment variables:

Create .env files in both client and server directories. Refer to .env.example files provided for necessary variables (e.g., Firebase config keys, MongoDB credentials).

Start the backend server:
cd server npm start 5. Start the frontend development server:

cd client npm start
