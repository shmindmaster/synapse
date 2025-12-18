---
applyTo: '**/*.ts, **/*.js, **/*.json, **/*.spec.ts, **/*.e2e-spec.ts'
description: 'NestJS development standards and best practices for building Node.js server-side applications'
---

# NestJS Development Best Practices

> **Note:** NestJS is not part of the standard SHTrial platform stack. The standard backend stack is **Fastify (Node.js)** or **FastAPI (Python)**. This instruction file is provided for legacy repositories that may still use NestJS. For new projects, prefer Fastify or FastAPI.

## SHTrial Platform Context

These instructions apply to applications running on the **SHTrial Platform** - a unified DigitalOcean infrastructure with shared resources and per-app logical isolation.

### Platform Standards Reference
- **Primary:** `./UNIFIED_PLAYBOOK.md` (local file) - Complete platform architecture and standards
- **Configuration:** `./.env.example` - Environment variable template - Master configuration template (single source of truth)

### Key Platform Resources
- **Cluster:** `sh-demo-cluster` (NYC3, Kubernetes 1.34.1-do.1, CPU-only, 4 nodes)
- **Database:** `sh-shared-postgres` (Postgres 16 + pgvector, db-per-app isolation)
- **Storage:** `sh-storage` (DigitalOcean Spaces + CDN, prefix-per-app isolation)
- **Registry:** `registry.digitalocean.com/shtrial-reg`
- **Builder:** `sh-builder-nyc3` (Droplet for builds and deployments)
- **AI Services:** DigitalOcean GenAI serverless (https://inference.do-ai.run/v1)
- **DNS:** `*.shtrial.com` wildcard with Let's Encrypt TLS
- **Load Balancer:** NGINX Ingress Controller (shared)

### Application Standards
- **Naming Convention:** `{APP_SLUG}` pattern for all resources
- **Canonical Naming:** `{APP_SLUG}-backend`, `{APP_SLUG}-frontend` for deployments/services
- **Backend Stack:** FastAPI (Python 3.12) or Fastify (Node 22)
- **Frontend Stack:** Next.js 16 App Router or Vite 7
- **AI Orchestration:** LangGraph (code-first StateGraph, vendor-neutral)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Package Management:** Poetry (Python) / pnpm (TypeScript)

### Platform Constraints & Capabilities
- **✅ ENABLED:** Full access to all shared resources, complete credentials provided
- **✅ ENABLED:** Autonomous deployment and configuration management
- **✅ ENABLED:** End-to-end task completion without approval
- **❌ NO GPU:** All AI inference uses serverless endpoints (no local models)
- **❌ NO NEW INFRASTRUCTURE:** Use existing shared cluster, database, storage, registry
- **❌ NO `:latest` TAGS:** Use immutable tags (git-sha + timestamp)

### Configuration Management
All applications use local configuration files:
- **Template:** `./.env.example` - Environment variable template (committed to git)
- **Runtime:** `./.env` - Actual configuration (not committed, generated from template)
- **App Guide:** `./AGENTS.MD` - App-specific configuration and standards

### Canonical Image Naming
- Backend: `registry.digitalocean.com/shtrial-reg/{APP_SLUG}-backend:{TAG}`
- Tag format: `{git-sha}-{timestamp}` (immutable, no `:latest`)
- Build script: `scripts/shtrial-build-deploy.sh` with `ROLE=backend`

---


## Your Mission

You are an expert in NestJS development with deep knowledge of TypeScript, decorators, dependency injection, and modern Node.js patterns. Your goal is to guide developers in building maintainable and well-architected server-side applications using NestJS framework principles and best practices, focusing on speed and practical implementation.

## Core NestJS Principles

### **1. Dependency Injection (DI)**
- **Principle:** NestJS uses a powerful DI container that manages the instantiation and lifetime of providers.
- **Guidance for Copilot:**
  - Use `@Injectable()` decorator for services, repositories, and other providers
  - Inject dependencies through constructor parameters with proper typing
  - Prefer interface-based dependency injection for better testability
  - Use custom providers when you need specific instantiation logic

### **2. Modular Architecture**
- **Principle:** Organize code into feature modules that encapsulate related functionality.
- **Guidance for Copilot:**
  - Create feature modules with `@Module()` decorator
  - Import only necessary modules and avoid circular dependencies
  - Use `forRoot()` and `forFeature()` patterns for configurable modules
  - Implement shared modules for common functionality

### **3. Decorators and Metadata**
- **Principle:** Leverage decorators to define routes, middleware, guards, and other framework features.
- **Guidance for Copilot:**
  - Use appropriate decorators: `@Controller()`, `@Get()`, `@Post()`, `@Injectable()`
  - Apply validation decorators from `class-validator` library
  - Use custom decorators for cross-cutting concerns
  - Implement metadata reflection for advanced scenarios

## Project Structure Best Practices

### **Recommended Directory Structure**
```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── interfaces/
├── config/
├── modules/
│   ├── auth/
│   ├── users/
│   └── products/
└── shared/
    ├── services/
    └── constants/
```

### **File Naming Conventions**
- **Controllers:** `*.controller.ts` (e.g., `users.controller.ts`)
- **Services:** `*.service.ts` (e.g., `users.service.ts`)
- **Modules:** `*.module.ts` (e.g., `users.module.ts`)
- **DTOs:** `*.dto.ts` (e.g., `create-user.dto.ts`)
- **Entities:** `*.entity.ts` (e.g., `user.entity.ts`)
- **Guards:** `*.guard.ts` (e.g., `auth.guard.ts`)
- **Interceptors:** `*.interceptor.ts` (e.g., `logging.interceptor.ts`)
- **Pipes:** `*.pipe.ts` (e.g., `validation.pipe.ts`)
- **Filters:** `*.filter.ts` (e.g., `http-exception.filter.ts`)

## API Development Patterns

### **1. Controllers**
- Keep controllers thin - delegate business logic to services
- Use proper HTTP methods and status codes
- Implement input validation with DTOs
- Apply guards and interceptors at the appropriate level

```typescript
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseInterceptors(TransformInterceptor)
  async findAll(@Query() query: GetUsersDto): Promise<User[]> {
    return this.usersService.findAll(query);
  }

  @Post()
  @UsePipes(ValidationPipe)
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }
}
```

### **2. Services**
- Implement business logic in services, not controllers
- Use constructor-based dependency injection
- Create focused, single-responsibility services
- Handle errors appropriately and let filters catch them

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);
    await this.emailService.sendWelcomeEmail(savedUser.email);
    return savedUser;
  }
}
```

### **3. DTOs and Validation**
- Use class-validator decorators for input validation
- Create separate DTOs for different operations (create, update, query)
- Implement proper transformation with class-transformer

```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

## Database Integration

### **TypeORM Integration**
- Use TypeORM as the primary ORM for database operations
- Define entities with proper decorators and relationships
- Implement repository pattern for data access
- Use migrations for database schema changes

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### **Custom Repositories**
- Extend base repository functionality when needed
- Implement complex queries in repository methods
- Use query builders for dynamic queries


### **Role-Based Access Control**
- Implement RBAC using custom guards and decorators
- Use metadata to define required roles
- Create flexible permission systems

```typescript
@SetMetadata('roles', ['admin'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete(':id')
async remove(@Param('id') id: string): Promise<void> {
  return this.usersService.remove(id);
}
```

## Error Handling and Logging

### **Exception Filters**
- Create global exception filters for consistent error responses
- Handle different types of exceptions appropriately
- Log errors with proper context

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(`${request.method} ${request.url}`, exception);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception instanceof HttpException 
        ? exception.message 
        : 'Internal server error',
    });
  }
}
```

### **Logging**
- Use built-in Logger class for consistent logging
- Implement proper log levels (error, warn, log, debug, verbose)
- Add contextual information to logs

## Testing Strategies

### **Unit Testing**
- Test services independently using mocks
- Use Jest as the testing framework
- Create test suites for business logic

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should create a user', async () => {
    const createUserDto = { name: 'John', email: 'john@example.com' };
    const user = { id: '1', ...createUserDto };

    jest.spyOn(repository, 'create').mockReturnValue(user as User);
    jest.spyOn(repository, 'save').mockResolvedValue(user as User);

    expect(await service.create(createUserDto)).toEqual(user);
  });
});
```

### **Integration Testing**
- Use TestingModule for integration tests
- Test complete request/response cycles
- Mock external dependencies appropriately

### **E2E Testing**
- Test complete application flows
- Use supertest for HTTP testing

## Performance and Security

### **Performance Optimization**
- Implement caching strategies with Redis
- Use interceptors for response transformation
- Optimize database queries with proper indexing
- Implement pagination for large datasets

### **Security Best Practices**
- Validate all inputs using class-validator
- Implement rate limiting to prevent abuse
- Use CORS appropriately for cross-origin requests
- Sanitize outputs to prevent XSS attacks
- Use environment variables for sensitive configuration

```typescript
// Rate limiting example
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  @Post('login')
  @Throttle(5, 60) // 5 requests per minute
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

## Configuration Management

### **Environment Configuration**
- Use @nestjs/config for configuration management
- Validate configuration at startup
- Use different configs for different environments

```typescript
@Injectable()
export class ConfigService {
  constructor(
    @Inject(CONFIGURATION_TOKEN)
    private readonly config: Configuration,
  ) {}

  get databaseUrl(): string {
    return this.config.database.url;
  }

  get jwtSecret(): string {
    return this.config.jwt.secret;
  }
}
```

## Common Pitfalls to Avoid

- **Circular Dependencies:** Avoid importing modules that create circular references
- **Heavy Controllers:** Don't put business logic in controllers
- **Missing Error Handling:** Always handle errors appropriately
- **Improper DI Usage:** Don't create instances manually when DI can handle it
- **Missing Validation:** Always validate input data
- **Synchronous Operations:** Use async/await for database and external API calls
- **Memory Leaks:** Properly dispose of subscriptions and event listeners

## Development Workflow

### **Development Setup**
1. Use NestJS CLI for scaffolding: `nest generate module users`
2. Follow consistent file organization
3. Use TypeScript strict mode
4. Implement linting with ESLint
5. Use Prettier for code formatting

### **Code Review Checklist**
- [ ] Proper use of decorators and dependency injection
- [ ] Input validation with DTOs and class-validator
- [ ] Appropriate error handling and exception filters
- [ ] Consistent naming conventions
- [ ] Working implementation that meets requirements

## Conclusion

NestJS provides a powerful, opinionated framework for building Node.js applications. Focus on practical implementation and working solutions that leverage TypeScript and modern development patterns. Prioritize speed and efficiency over premature optimization.

---

<!-- End of NestJS Instructions -->
