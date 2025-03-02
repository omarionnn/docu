#!/bin/bash

# Start backend and frontend servers with proper port configuration
echo "Starting backend server on port 5009..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start frontend server pointing to backend on port 5009
echo "Starting frontend server on port 3009..."
cd frontend
PORT=3009 npm start &
FRONTEND_PID=$!
cd ..

echo "Servers started:"
echo "- Backend running on port 5009"
echo "- Frontend running on port 3009"
echo "- Frontend configured to connect to backend on port 5009"
echo ""
echo "Use ./stop-servers.sh to stop all servers"