#!/bin/bash

# Stop backend and frontend servers
echo "Stopping backend server..."
pkill -f "nodemon server.js"
pkill -f "node server.js"

echo "Stopping frontend server..."
pkill -f "react-scripts start"

echo "All servers stopped."