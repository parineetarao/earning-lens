# backend/Dockerfile

# Python 3.11 slim — minimal base image, no GPU, no ML libraries
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Install system dependencies needed by PyMuPDF
# libmupdf-dev provides the PDF rendering engine
RUN apt-get update && apt-get install -y \
    libmupdf-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first — Docker caches this layer
# If requirements.txt does not change, Docker skips pip install on rebuilds
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose the port Render will use
EXPOSE 8000

# Start the server
# Use 0.0.0.0 so the container accepts external connections
# Workers=1 keeps memory usage low on Render free tier
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]