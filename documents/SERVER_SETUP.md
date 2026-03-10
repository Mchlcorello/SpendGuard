# Ubuntu Server Setup Guide

Complete guide for setting up an Ubuntu server to host SpendGuard with Docker and Portainer.

## Server Requirements

### Minimum Specifications
- **OS**: Ubuntu 22.04 LTS or newer
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Network**: Static IP or domain name

### Recommended Specifications
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Network**: Static IP with domain name

## Initial Server Setup

### 1. Update System

```bash
# Update package list and upgrade
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git vim ufw
```

### 2. Create Application User

```bash
# Create dedicated user for application
sudo useradd -m -s /bin/bash spendguard
sudo usermod -aG sudo spendguard

# Set password
sudo passwd spendguard
```

### 3. Configure SSH

```bash
# Generate SSH key on your local machine
ssh-keygen -t ed25519 -C "spendguard-deploy"

# Copy public key to server
ssh-copy-id spendguard@your-server-ip

# On server: Harden SSH configuration
sudo vim /etc/ssh/sshd_config
```

**Recommended SSH settings:**
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 22
```

```bash
# Restart SSH service
sudo systemctl restart sshd
```

### 4. Configure Firewall

```bash
# Enable UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if you modified it)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Portainer (optional, can use SSH tunnel instead)
sudo ufw allow 9443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

## Docker Installation

### 1. Install Docker Engine

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt update
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### 2. Configure Docker

```bash
# Add user to docker group
sudo usermod -aG docker $USER
sudo usermod -aG docker spendguard

# Log out and back in for group changes to take effect
# Or run: newgrp docker

# Enable Docker to start on boot
sudo systemctl enable docker
sudo systemctl start docker

# Verify Docker is running
sudo systemctl status docker
```

### 3. Configure Docker Daemon

```bash
# Create daemon configuration
sudo vim /etc/docker/daemon.json
```

**Add the following configuration:**
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true
}
```

```bash
# Restart Docker
sudo systemctl restart docker
```

## Portainer Installation

### 1. Create Portainer Volume

```bash
# Create persistent volume for Portainer data
docker volume create portainer_data
```

### 2. Deploy Portainer

```bash
# Run Portainer CE (Community Edition)
docker run -d \
  -p 8000:8000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# Verify Portainer is running
docker ps | grep portainer
```

### 3. Initial Portainer Setup

1. Access Portainer at `https://your-server-ip:9443`
2. Create admin account (username and password)
3. Select "Docker" as the environment
4. Connect to local Docker environment

### 4. Configure Portainer

**Create Stack:**
1. Go to **Stacks** → **Add stack**
2. Name: `SpendGuard`
3. Build method: **Git Repository** or **Upload**
4. Repository URL: `https://github.com/yourusername/SpendGuard`
5. Compose path: `compose/docker-compose.yml`
6. Add environment variables from `.env.prod`
7. Click **Deploy the stack**

**Enable Webhook:**
1. Go to your stack
2. Click **Webhook** tab
3. Enable webhook
4. Copy webhook URL
5. Add to GitHub secrets as `PORTAINER_WEBHOOK_URL`

## Application Setup

### 1. Create Application Directory

```bash
# Create directory structure
sudo mkdir -p /opt/spendguard
sudo chown spendguard:spendguard /opt/spendguard
cd /opt/spendguard

# Clone repository (optional, if not using Portainer Git integration)
git clone https://github.com/yourusername/SpendGuard.git .
```

### 2. Configure Environment Files

```bash
cd /opt/spendguard/compose

# Create production environment file
cat > .env.prod << 'EOF'
IMAGE_REPO=ghcr.io/yourusername/spendguard
IMAGE_TAG=latest
APP_ENV=production
API_BASE_URL=https://api.spendguard.example.com
EOF

# Secure the file
chmod 600 .env.prod
```

### 3. Container Registry Authentication

```bash
# Login to GitHub Container Registry
# Replace USERNAME and TOKEN with your credentials
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Save credentials for automatic pulls
# Docker will store in ~/.docker/config.json
```

### 4. Deploy Application

```bash
# Pull latest images
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker compose ps

# View logs
docker compose logs -f budget-app
```

## Reverse Proxy Setup (Optional but Recommended)

### Option 1: Traefik

```bash
# Create Traefik configuration
mkdir -p /opt/traefik
cd /opt/traefik

# Create docker-compose.yml for Traefik
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/traefik.yml:ro
      - ./acme.json:/acme.json
    networks:
      - web

networks:
  web:
    external: true
EOF

# Create Traefik configuration
cat > traefik.yml << 'EOF'
api:
  dashboard: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@example.com
      storage: acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    exposedByDefault: false
EOF

# Create acme.json for SSL certificates
touch acme.json
chmod 600 acme.json

# Create network
docker network create web

# Start Traefik
docker compose up -d
```

### Option 2: Caddy

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Create Caddyfile
sudo vim /etc/caddy/Caddyfile
```

**Caddyfile configuration:**
```
spendguard.example.com {
    reverse_proxy localhost:80
    encode gzip
}
```

```bash
# Reload Caddy
sudo systemctl reload caddy
```

## Monitoring and Logging

### 1. Container Logs

```bash
# View all logs
docker compose logs

# Follow logs
docker compose logs -f

# View specific service
docker compose logs budget-app

# Last 100 lines
docker compose logs --tail=100 budget-app
```

### 2. System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor Docker stats
docker stats

# Monitor disk usage
df -h
docker system df
```

### 3. Log Rotation

Docker logs are automatically rotated based on daemon.json configuration:
- Max size: 10MB per file
- Max files: 3 files per container

## Backup Strategy

### 1. Backup Volumes

```bash
# Create backup directory
sudo mkdir -p /opt/backups

# Backup Portainer data
docker run --rm \
  -v portainer_data:/data \
  -v /opt/backups:/backup \
  alpine tar czf /backup/portainer-$(date +%Y%m%d).tar.gz -C /data .

# Backup application data (if any)
docker run --rm \
  -v spendguard_data:/data \
  -v /opt/backups:/backup \
  alpine tar czf /backup/spendguard-$(date +%Y%m%d).tar.gz -C /data .
```

### 2. Automated Backups

```bash
# Create backup script
sudo vim /usr/local/bin/backup-containers.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d)

# Backup Portainer
docker run --rm \
  -v portainer_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/portainer-$DATE.tar.gz -C /data .

# Remove backups older than 30 days
find $BACKUP_DIR -name "portainer-*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-containers.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
```

Add line:
```
0 2 * * * /usr/local/bin/backup-containers.sh >> /var/log/backup.log 2>&1
```

## Security Hardening

### 1. Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades

# Configure automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 2. Fail2Ban

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo vim /etc/fail2ban/jail.local
```

Enable SSH protection:
```
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600
```

```bash
# Start Fail2Ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status sshd
```

### 3. Docker Security

```bash
# Run Docker bench security
docker run --rm -it --net host --pid host --userns host --cap-add audit_control \
  -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
  -v /var/lib:/var/lib \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /usr/lib/systemd:/usr/lib/systemd \
  -v /etc:/etc --label docker_bench_security \
  docker/docker-bench-security
```

## Maintenance

### Regular Tasks

**Daily:**
```bash
# Check container status
docker ps -a

# Check disk space
df -h
docker system df
```

**Weekly:**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean up Docker
docker system prune -f

# Check logs for errors
docker compose logs --tail=100 | grep -i error
```

**Monthly:**
```bash
# Update Docker images
docker compose pull
docker compose up -d

# Review security updates
sudo apt list --upgradable

# Test backups
# Restore to test environment
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs spendguard-budget-app

# Inspect container
docker inspect spendguard-budget-app

# Check resource usage
docker stats
```

### Out of Disk Space

```bash
# Check disk usage
df -h
docker system df

# Clean up
docker system prune -a --volumes
```

### Network Issues

```bash
# Check Docker networks
docker network ls
docker network inspect spendguard-network

# Restart Docker
sudo systemctl restart docker
```

## Support and Resources

- **Docker Documentation**: https://docs.docker.com/
- **Portainer Documentation**: https://docs.portainer.io/
- **Ubuntu Server Guide**: https://ubuntu.com/server/docs
- **GitHub Actions**: https://docs.github.com/en/actions
