FROM python:3.9-slim

# Install minimal dependencies (no GUI)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

WORKDIR /app

# Install headless OpenCV first
RUN pip install opencv-python-headless==4.8.1.78

COPY requirements-headless.txt .
RUN pip install --no-cache-dir -r requirements-headless.txt

COPY run-camera-headless.py .

# Create user
RUN useradd -m -u 1000 appuser
USER appuser

# Environment variables for headless operation
ENV PYTHONUNBUFFERED=1
ENV QT_QPA_PLATFORM=offscreen
ENV OPENCV_LOG_LEVEL=ERROR
ENV DISPLAY=:99

CMD ["python", "run-camera-headless.py"]