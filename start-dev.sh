#!/bin/bash

# Start the backend and frontend servers for development

# Start backend server
echo "Starting backend server..."
cd backend
npm install --no-save
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start frontend server
echo "Starting frontend server..."
cd frontend
npm install --no-save
npm start &
FRONTEND_PID=$!
cd ..

# Handle script termination
function cleanup {
  echo "Stopping servers..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit
}

# Register the cleanup function for when script exits
trap cleanup INT TERM

# Keep script running
echo "Both servers are running. Press Ctrl+C to stop."
wait