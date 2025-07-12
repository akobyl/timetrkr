# TimeTrkr Deployment Guide

This guide covers containerization and Kubernetes deployment for TimeTrkr.

## Container Build

### Manual Build
```bash
# Build the container locally
docker build -t timetrkr:latest .

# Run locally for testing
docker run -p 8080:80 -v $(pwd)/db:/app/db timetrkr:latest
```

### GitHub Actions
The repository includes GitHub Actions workflow that automatically:
- Builds multi-platform containers (linux/amd64, linux/arm64)
- Pushes to GitHub Container Registry (ghcr.io)
- Runs security scans with Trivy
- Tags images based on git tags and branches

Container images are available at: `ghcr.io/your-username/timetrkr`

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (local or cloud)
- `kubectl` configured to access your cluster
- Optional: `kustomize` for easier deployment management

### Quick Deployment

1. **Update image reference:**
   Edit `k8s/deployment.yml` and replace `your-username` with your GitHub username:
   ```yaml
   image: ghcr.io/your-username/timetrkr:latest
   ```

2. **Deploy with kubectl:**
   ```bash
   kubectl apply -f k8s/
   ```

3. **Or deploy with kustomize:**
   ```bash
   # Update the image reference in k8s/kustomization.yml first
   kubectl apply -k k8s/
   ```

### Access the Application

**NodePort Service (development):**
```bash
# Access via NodePort (if using NodePort service)
kubectl get nodes -o wide
# Access at http://<node-ip>:30080
```

**Port Forward (local development):**
```bash
kubectl port-forward service/timetrkr-service 8080:80
# Access at http://localhost:8080
```

**Ingress (production):**
```bash
# Enable ingress in k8s/kustomization.yml
# Configure your domain in k8s/ingress.yml
# Ensure you have an ingress controller installed
```

### Database Persistence

The SQLite database is persisted using Kubernetes PersistentVolumes:
- **PersistentVolume**: Stores data on host at `/data/timetrkr/db`
- **PersistentVolumeClaim**: Requests 5Gi of storage
- **Volume Mount**: Mounts to `/app/db` in the container

For production, consider:
- Using a managed database service
- Configuring proper backup strategies
- Using dynamic provisioning instead of hostPath

### Configuration

**Environment Variables:**
- `DATABASE_URL`: SQLite database connection (default: `sqlite:///app/db/timetrkr.db`)

**Resource Limits:**
- Memory: 256Mi request, 512Mi limit
- CPU: 250m request, 500m limit

### Monitoring

**Health Checks:**
- **Liveness Probe**: `/docs` endpoint every 30s
- **Readiness Probe**: `/docs` endpoint every 5s

**Logs:**
```bash
kubectl logs deployment/timetrkr -f
```

### Scaling

```bash
# Scale the deployment
kubectl scale deployment timetrkr --replicas=3

# Note: SQLite doesn't support multiple writers
# For horizontal scaling, migrate to PostgreSQL/MySQL
```

### Updates

**Using GitHub Actions:**
1. Push to main branch or create a git tag
2. GitHub Actions builds and pushes new image
3. Update Kubernetes deployment:
   ```bash
   kubectl set image deployment/timetrkr timetrkr=ghcr.io/your-username/timetrkr:new-tag
   ```

**Rolling Updates:**
```bash
# Force a rolling restart
kubectl rollout restart deployment/timetrkr

# Check rollout status
kubectl rollout status deployment/timetrkr

# View rollout history
kubectl rollout history deployment/timetrkr
```

### Troubleshooting

**Check pod status:**
```bash
kubectl get pods -l app=timetrkr
kubectl describe pod <pod-name>
```

**Check logs:**
```bash
kubectl logs <pod-name>
kubectl logs deployment/timetrkr --previous
```

**Check persistent volume:**
```bash
kubectl get pv,pvc
kubectl describe pvc timetrkr-db-pvc
```

**Common Issues:**
- Image pull errors: Check GitHub Container Registry permissions
- Database connection: Verify PVC is bound and mounted correctly
- Service access: Check service endpoints and pod readiness

### Security Considerations

- Container runs as non-root user (appuser)
- Security scanning included in CI/CD pipeline
- SQLite database persisted outside container
- Consider using Kubernetes secrets for sensitive configuration
- Enable ingress TLS for production deployments

### Production Recommendations

1. **Database**: Migrate to PostgreSQL/MySQL for production
2. **Storage**: Use cloud storage classes instead of hostPath
3. **SSL/TLS**: Configure ingress with SSL certificates
4. **Backup**: Implement database backup strategies
5. **Monitoring**: Add Prometheus metrics and Grafana dashboards
6. **Secrets**: Use Kubernetes secrets for sensitive data
7. **Network Policies**: Implement network policies for security
8. **Resource Quotas**: Set namespace resource quotas