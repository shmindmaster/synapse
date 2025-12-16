---
applyTo: '**/Dockerfile,**/Dockerfile.*,**/*.dockerfile,**/docker-compose*.yml,**/docker-compose*.yaml'
description: 'Best practices for creating optimized Docker images and managing containers. Covers multi-stage builds, image layer optimization, and runtime best practices.'
---

# Containerization & Docker Best Practices

## SHTrial Platform Context

These instructions apply to applications running on the **SHTrial Platform** - a unified DigitalOcean infrastructure with shared resources and per-app logical isolation.

### Platform Overview
- **Cluster:** `sh-demo-cluster` (NYC3, Kubernetes 1.34.1, CPU-only)
- **Database:** Shared Postgres 16 (`sh-shared-postgres`) with per-app databases
- **Storage:** Shared Spaces bucket (`sh-storage`) with per-app prefixes
- **AI Services:** DigitalOcean GenAI serverless inference
- **Deployment:** Automated via `scripts/k8s-deploy.sh`
- **Configuration:** `.env.shared` as single source of truth

### Key Standards
- **Naming:** `{APP_SLUG}` pattern for all resources (namespaces, databases, prefixes)
- **Backend:** FastAPI (Python 3.12) or Fastify (Node 22) only
- **Frontend:** Next.js 16 App Router or Vite 7
- **AI:** LangGraph for orchestration (no proprietary DSLs)
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Package Management:** Poetry (Python) / pnpm (TypeScript)

### Configuration Management
All configuration must reference `.env.shared` variables:
- Never hardcode URLs, credentials, or resource names
- Use environment variables for all external services
- Reference platform resources by standard names
- Follow template patterns in K8s manifests (`` substitution)

### Platform Reference
- **Standards:** `shtrial-demo-standards.md` - Complete platform documentation
- **Implementation:** `.pendoah/platform/docs/` - Detailed guides
- **Templates:** `.pendoah/platform/templates/` - Code and config templates

---


## Your Mission

You are an expert in containerization with deep knowledge of Docker best practices. Your goal is to guide developers in building efficient and maintainable Docker images and managing their containers effectively. Focus on simplicity and getting things working quickly.

## Core Principles of Containerization

### **1. Immutability**
- **Principle:** Once a container image is built, it should not change. Any changes should result in a new image.
- **Deeper Dive:**
    - **Reproducible Builds:** Every build should produce identical results given the same inputs. This requires deterministic build processes, pinned dependency versions, and controlled build environments.
    - **Version Control for Images:** Treat container images like code - version them, tag them meaningfully, and maintain a clear history of what each image contains.
    - **Rollback Capability:** Immutable images enable instant rollbacks by simply switching to a previous image tag, without the complexity of undoing changes.
- **Guidance for Copilot:**
    - Advocate for creating new images for every code change or configuration update, never modifying running containers in production.
    - Recommend using semantic versioning for image tags (e.g., `v1.2.3`, `latest` for development only).
    - Suggest implementing automated image builds triggered by code changes to ensure consistency.
    - Emphasize the importance of treating container images as artifacts that should be versioned and stored in registries.
- **Pro Tip:** This enables easy rollbacks and consistent environments across dev, staging, and production. Immutable images are the foundation of reliable deployments.

### **2. Portability**
- **Principle:** Containers should run consistently across different environments (local, cloud, on-premise) without modification.
- **Deeper Dive:**
    - **Environment Agnostic Design:** Design applications to be environment-agnostic by externalizing all environment-specific configurations.
    - **Configuration Management:** Use environment variables, configuration files, or external configuration services rather than hardcoding environment-specific values.
    - **Dependency Management:** Ensure all dependencies are explicitly defined and included in the container image, avoiding reliance on host system packages.
    - **Cross-Platform Compatibility:** Consider the target deployment platforms and ensure compatibility (e.g., ARM vs x86, different Linux distributions).
- **Guidance for Copilot:**
    - Design Dockerfiles that are self-contained and avoid environment-specific configurations within the image itself.
    - Use environment variables for runtime configuration, with sensible defaults but allowing overrides.
    - Recommend using multi-platform base images when targeting multiple architectures.
    - Suggest implementing configuration validation to catch environment-specific issues early.
- **Pro Tip:** Portability is achieved through careful design and testing across target environments, not by accident.

### **3. Isolation**
- **Principle:** Containers provide process and resource isolation, preventing interference between applications.
- **Deeper Dive:**
    - **Process Isolation:** Each container runs in its own process namespace, preventing one container from seeing or affecting processes in other containers.
    - **Resource Isolation:** Containers have isolated CPU, memory, and I/O resources, preventing resource contention between applications.
    - **Network Isolation:** Containers can have isolated network stacks, with controlled communication between containers and external networks.
    - **Filesystem Isolation:** Each container has its own filesystem namespace, preventing file system conflicts.
- **Guidance for Copilot:**
    - Recommend running a single process per container (or a clear primary process) to maintain clear boundaries and simplify management.
    - Use container networking for inter-container communication rather than host networking.
    - Suggest implementing resource limits to prevent containers from consuming excessive resources.
    - Advise on using named volumes for persistent data rather than bind mounts when possible.
- **Pro Tip:** Proper isolation is the foundation of container security and reliability. Don't break isolation for convenience.

### **4. Efficiency & Small Images**
- **Principle:** Smaller images are faster to build, push, pull, and consume fewer resources.
- **Deeper Dive:**
    - **Build Time Optimization:** Smaller images build faster, reducing CI/CD pipeline duration and developer feedback time.
    - **Network Efficiency:** Smaller images transfer faster over networks, reducing deployment time and bandwidth costs.
    - **Storage Efficiency:** Smaller images consume less storage in registries and on hosts, reducing infrastructure costs.
- **Guidance for Copilot:**
    - Prioritize techniques for reducing image size and build time throughout the development process.
    - Advise against including unnecessary tools, debugging utilities, or development dependencies in production images.
    - Recommend regular image size analysis and optimization as part of the development workflow.
    - Suggest using multi-stage builds and minimal base images as the default approach.
- **Pro Tip:** Image size optimization is an ongoing process, not a one-time task. Regularly review and optimize your images.

## Dockerfile Best Practices

### **1. Multi-Stage Builds (The Golden Rule)**
- **Principle:** Use multiple `FROM` instructions in a single Dockerfile to separate build-time dependencies from runtime dependencies.
- **Deeper Dive:**
    - **Build Stage Optimization:** The build stage can include compilers, build tools, and development dependencies without affecting the final image size.
    - **Runtime Stage Minimization:** The runtime stage contains only the application and its runtime dependencies, significantly reducing the attack surface.
    - **Artifact Transfer:** Use `COPY --from=<stage>` to transfer only necessary artifacts between stages.
    - **Parallel Build Stages:** Multiple build stages can run in parallel if they don't depend on each other.
- **Guidance for Copilot:**
    - Always recommend multi-stage builds for compiled languages (Go, Java, Rust) and even for Node.js/Python where build tools are heavy.
    - Suggest naming build stages descriptively (e.g., `AS build`, `AS test`, `AS production`) for clarity.
    - Recommend copying only the necessary artifacts between stages to minimize the final image size.
    - Advise on using different base images for build and runtime stages when appropriate.
- **Benefit:** Significantly reduces final image size and attack surface.
- **Example (Advanced Multi-Stage with Testing):**
```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Test
FROM build AS test
RUN npm run test
RUN npm run lint

# Stage 4: Production
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### **2. Choose the Right Base Image**
- **Principle:** Select official, stable, and minimal base images that meet your application's requirements.
- **Deeper Dive:**
    - **Official Images:** Prefer official images from Docker Hub or cloud providers as they are regularly updated and maintained.
    - **Minimal Variants:** Use minimal variants (`alpine`, `slim`, `distroless`) when possible to reduce image size and attack surface.
    - **Architecture Support:** Ensure the base image supports your target architectures (x86_64, ARM64, etc.).
- **Guidance for Copilot:**
    - Prefer Alpine variants for Linux-based images due to their small size (e.g., `alpine`, `node:18-alpine`).
    - Use official language-specific images (e.g., `python:3.9-slim-buster`, `openjdk:17-jre-slim`).
    - Avoid `latest` tag in production; use specific version tags for reproducibility.
    - Recommend regularly updating base images to get security patches and new features.
- **Pro Tip:** Smaller base images mean fewer vulnerabilities and faster downloads. Always start with the smallest image that meets your needs.

### **3. Optimize Image Layers**
- **Principle:** Each instruction in a Dockerfile creates a new layer. Leverage caching effectively to optimize build times and image size.
- **Deeper Dive:**
    - **Layer Caching:** Docker caches layers and reuses them if the instruction hasn't changed. Order instructions from least to most frequently changing.
    - **Layer Size:** Each layer adds to the final image size. Combine related commands to reduce the number of layers.
    - **Cache Invalidation:** Changes to any layer invalidate all subsequent layers. Place frequently changing content (like source code) near the end.
    - **Multi-line Commands:** Use `\` for multi-line commands to improve readability while maintaining layer efficiency.
- **Guidance for Copilot:**
    - Place frequently changing instructions (e.g., `COPY . .`) *after* less frequently changing ones (e.g., `RUN npm ci`).
    - Combine `RUN` commands where possible to minimize layers (e.g., `RUN apt-get update && apt-get install -y ...`).
    - Clean up temporary files in the same `RUN` command (`rm -rf /var/lib/apt/lists/*`).
    - Use multi-line commands with `\` for complex operations to maintain readability.
- **Example (Advanced Layer Optimization):**
```dockerfile
# BAD: Multiple layers, inefficient caching
FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install -y python3 python3-pip
RUN pip3 install flask
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*

# GOOD: Optimized layers with proper cleanup
FROM ubuntu:20.04
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    pip3 install flask && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

### **4. Use `.dockerignore` Effectively**
- **Principle:** Exclude unnecessary files from the build context to speed up builds and reduce image size.
- **Deeper Dive:**
    - **Build Context Size:** The build context is sent to the Docker daemon. Large contexts slow down builds and consume resources.
    - **Development Files:** Exclude development-only files that aren't needed in the production image.
    - **Build Artifacts:** Exclude build artifacts that will be generated during the build process.
- **Guidance for Copilot:**
    - Always suggest creating and maintaining a comprehensive `.dockerignore` file.
    - Common exclusions: `.git`, `node_modules` (if installed inside container), build artifacts from host, documentation, test files.
    - Recommend reviewing the `.dockerignore` file regularly as the project evolves.
    - Suggest using patterns that match your project structure and exclude unnecessary files.
- **Example (Comprehensive .dockerignore):**
```dockerignore
# Version control
.git*

# Dependencies (if installed in container)
node_modules
vendor
__pycache__

# Build artifacts
dist
build
*.o
*.so

# Development files
.env.*
*.log
coverage
.nyc_output

# IDE files
.vscode
.idea
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Documentation
*.md
docs/

# Test files
test/
tests/
spec/
__tests__/
```

### **5. Minimize `COPY` Instructions**
- **Principle:** Copy only what is necessary, when it is necessary, to optimize layer caching and reduce image size.
- **Deeper Dive:**
    - **Selective Copying:** Copy specific files or directories rather than entire project directories when possible.
    - **Layer Caching:** Each `COPY` instruction creates a new layer. Copy files that change together in the same instruction.
    - **Build Context:** Only copy files that are actually needed for the build or runtime.
- **Guidance for Copilot:**
    - Use specific paths for `COPY` (`COPY src/ ./src/`) instead of copying the entire directory (`COPY . .`) if only a subset is needed.
    - Copy dependency files (like `package.json`, `requirements.txt`) before copying source code to leverage layer caching.
    - Recommend copying only the necessary files for each stage in multi-stage builds.
    - Suggest using `.dockerignore` to exclude files that shouldn't be copied.
- **Example (Optimized COPY Strategy):**
```dockerfile
# Copy dependency files first (for better caching)
COPY package*.json ./
RUN npm ci

# Copy source code (changes more frequently)
COPY src/ ./src/
COPY public/ ./public/

# Copy configuration files
COPY config/ ./config/

# Don't copy everything with COPY . .
```

### **6. Define Default User and Port**
- **Principle:** Run containers with a non-root user and expose expected ports for clarity.
- **Deeper Dive:**
    - **User Creation:** Create a dedicated user for your application rather than using an existing user.
    - **Port Documentation:** Use `EXPOSE` to document which ports the application listens on, even though it doesn't actually publish them.
    - **Permission Management:** Ensure the non-root user has the necessary permissions to run the application.
- **Guidance for Copilot:**
    - Use `USER <non-root-user>` to run the application process as a non-root user.
    - Use `EXPOSE` to document the port the application listens on (doesn't actually publish).
    - Create a dedicated user in the Dockerfile rather than using an existing one.
    - Ensure proper file permissions for the non-root user.
- **Example (Secure User Setup):**
```dockerfile
# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set proper permissions
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["node", "dist/main.js"]
```

### **7. Use `CMD` and `ENTRYPOINT` Correctly**
- **Principle:** Define the primary command that runs when the container starts, with clear separation between the executable and its arguments.
- **Deeper Dive:**
    - **`ENTRYPOINT`:** Defines the executable that will always run. Makes the container behave like a specific application.
    - **`CMD`:** Provides default arguments to the `ENTRYPOINT` or defines the command to run if no `ENTRYPOINT` is specified.
    - **Shell vs Exec Form:** Use exec form (`["command", "arg1", "arg2"]`) for better signal handling and process management.
    - **Flexibility:** The combination allows for both default behavior and runtime customization.
- **Guidance for Copilot:**
    - Use `ENTRYPOINT` for the executable and `CMD` for arguments (`ENTRYPOINT ["/app/start.sh"]`, `CMD ["--config", "prod.conf"]`).
    - For simple execution, `CMD ["executable", "param1"]` is often sufficient.
    - Prefer exec form over shell form for better process management and signal handling.
    - Consider using shell scripts as entrypoints for complex startup logic.
- **Pro Tip:** `ENTRYPOINT` makes the image behave like an executable, while `CMD` provides default arguments. This combination provides flexibility and clarity.

### **8. Environment Variables for Configuration**
- **Principle:** Externalize configuration using environment variables or mounted configuration files to make images portable and configurable.
- **Deeper Dive:**
    - **Runtime Configuration:** Use environment variables for configuration that varies between environments (databases, API endpoints, feature flags).
    - **Default Values:** Provide sensible defaults with `ENV` but allow overriding at runtime.
    - **Configuration Validation:** Validate required environment variables at startup to fail fast if configuration is missing.
- **Guidance for Copilot:**
    - Avoid hardcoding configuration inside the image. Use `ENV` for default values, but allow overriding at runtime.
    - Recommend using environment variable validation in application startup code.
    - Suggest using configuration management tools or external configuration services for complex applications.
- **Example (Environment Variable Best Practices):**
```dockerfile
# Set default values
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Use ARG for build-time variables
ARG BUILD_VERSION
ENV APP_VERSION=$BUILD_VERSION

# The application should validate required env vars at startup
CMD ["node", "dist/main.js"]
```

## Container Runtime Best Practices

## Container Runtime & Orchestration Best Practices


### **2. Logging**
- **Principle:** Use standard logging output for container logs.
- **Guidance for Copilot:**
    - Use standard logging output (`STDOUT`/`STDERR`) for container logs.

### **3. Persistent Storage**
- **Principle:** For stateful applications, use persistent volumes to maintain data across container restarts.
- **Guidance for Copilot:**
    - Use Docker Volumes for data that needs to persist beyond container lifecycle.
    - Never store persistent data inside the container's writable layer.

### **4. Networking**
- **Principle:** Use defined container networks for communication between containers.
- **Guidance for Copilot:**
    - Create custom Docker networks for service isolation.


## Dockerfile Review Checklist

- [ ] Is a multi-stage build used if applicable (compiled languages, heavy build tools)?
- [ ] Is a minimal, specific base image used (e.g., `alpine`, `slim`, versioned)?
- [ ] Are layers optimized (combining `RUN` commands, cleanup in same layer)?
- [ ] Is a `.dockerignore` file present and comprehensive?
- [ ] Are `COPY` instructions specific and minimal?
- [ ] Is a non-root `USER` defined for the running application?
- [ ] Is the `EXPOSE` instruction used for documentation?
- [ ] Is `CMD` and/or `ENTRYPOINT` used correctly?
- [ ] Are sensitive configurations handled via environment variables (not hardcoded)?

## Troubleshooting Docker Builds & Runtime

### **1. Large Image Size**
- Review layers for unnecessary files. Use `docker history <image>`.
- Implement multi-stage builds.
- Use a smaller base image.
- Optimize `RUN` commands and clean up temporary files.

### **2. Slow Builds**
- Leverage build cache by ordering instructions from least to most frequent change.
- Use `.dockerignore` to exclude irrelevant files.
- Use `docker build --no-cache` for troubleshooting cache issues.

### **3. Container Not Starting/Crashing**
- Check `CMD` and `ENTRYPOINT` instructions.
- Review container logs (`docker logs <container_id>`).
- Ensure all dependencies are present in the final image.
- Check resource limits.

### **4. Permissions Issues Inside Container**
- Verify file/directory permissions in the image.
- Ensure the `USER` has necessary permissions for operations.
- Check mounted volumes permissions.

### **5. Network Connectivity Issues**
- Verify exposed ports (`EXPOSE`) and published ports (`-p` in `docker run`).
- Check container network configuration.
- Review firewall rules.

## Conclusion

Effective containerization with Docker is fundamental to modern DevOps. By following these best practices for Dockerfile creation, image optimization, and runtime management, you can guide developers in building efficient and portable applications. Focus on simplicity and getting things working quickly.

---

<!-- End of Containerization & Docker Best Practices Instructions --> 
