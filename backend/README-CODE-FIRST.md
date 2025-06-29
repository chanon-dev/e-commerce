# 🏗️ Code-First Backend Implementation

## 📋 Overview

Complete **Code-First approach** implementation for all backend services using Entity Framework Core (.NET), TypeORM (NestJS), and GORM (Go). This approach defines database schema through code entities and generates migrations automatically.

## 🎯 Architecture Patterns

### **Code-First Benefits**
- ✅ **Version Control**: Database schema tracked in code
- ✅ **Type Safety**: Strong typing across all layers
- ✅ **Automatic Migrations**: Generated from entity changes
- ✅ **Cross-Platform**: Consistent across different technologies
- ✅ **Developer Productivity**: IntelliSense and compile-time checks
- ✅ **Refactoring Support**: Safe schema changes

## 🏢 Service Implementations

### **1. .NET Services (Entity Framework Core)**

#### **User Service - Clean Architecture**
```csharp
// Domain Entity with Rich Business Logic
[Table("users")]
public class User : BaseEntity
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("email")]
    [MaxLength(255)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    // Business Logic Methods
    public void LockAccount(TimeSpan lockDuration)
    {
        LockedUntil = DateTime.UtcNow.Add(lockDuration);
        LoginAttempts = 0;
    }

    public bool IsLocked => LockedUntil.HasValue && LockedUntil > DateTime.UtcNow;
}

// DbContext with Advanced Configuration
public class UserDbContext : DbContext
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Fluent API Configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasCheckConstraint("CK_users_email_format", 
                "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'");
            entity.Property(e => e.Preferences).HasColumnType("jsonb");
        });
    }
}
```

#### **Order Service - Domain-Driven Design**
```csharp
// Rich Domain Entity
[Table("orders")]
public class Order : BaseEntity
{
    // Value Objects and Business Rules
    public void AddItem(Guid productId, string productName, decimal unitPrice, int quantity)
    {
        var existingItem = Items.FirstOrDefault(i => i.ProductId == productId);
        if (existingItem != null)
        {
            existingItem.UpdateQuantity(existingItem.Quantity + quantity);
        }
        else
        {
            Items.Add(new OrderItem { /* ... */ });
        }
        RecalculateTotals();
    }

    public void Cancel(string reason, string? cancelledBy = null)
    {
        if (!CanBeCancelled)
            throw new InvalidOperationException("Order cannot be cancelled");
        
        UpdateStatus(OrderStatus.Cancelled, reason, cancelledBy);
    }
}
```

### **2. Go Services (GORM)**

#### **Product Service - Hexagonal Architecture**
```go
// Rich Domain Entity with Business Logic
type Product struct {
    BaseEntity
    ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
    Name        string    `gorm:"type:varchar(255);not null;index"`
    Price       float64   `gorm:"type:decimal(18,2);not null;check:price >= 0"`
    
    // Relationships
    Images     []ProductImage    `gorm:"foreignKey:ProductID;constraint:OnDelete:CASCADE"`
    Variants   []ProductVariant  `gorm:"foreignKey:ProductID;constraint:OnDelete:CASCADE"`
    
    // Computed fields (not stored in DB)
    IsInStock  bool    `gorm:"-"`
    IsOnSale   bool    `gorm:"-"`
}

// Business Logic Methods
func (p *Product) IsAvailable() bool {
    return p.Status == ProductStatusActive && p.IsInStockCheck()
}

func (p *Product) CanPurchase(quantity int) bool {
    if !p.IsAvailable() {
        return false
    }
    return !p.TrackQuantity || p.AllowBackorder || p.Quantity >= quantity
}

// GORM Hooks
func (p *Product) BeforeCreate(tx *gorm.DB) error {
    if p.Slug == "" {
        p.Slug = generateSlug(p.Name)
    }
    return nil
}
```

### **3. NestJS Services (TypeORM)**

#### **Auth Service - Modular Architecture**
```typescript
// Rich Entity with Decorators and Business Logic
@Entity('users')
@Index(['email'], { unique: true })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'jsonb', nullable: true })
    preferences?: Record<string, any>;

    // Virtual Properties
    get full_name(): string {
        return `${this.first_name || ''} ${this.last_name || ''}`.trim();
    }

    get is_locked(): boolean {
        return this.locked_until ? new Date() < this.locked_until : false;
    }

    // Business Logic Methods
    async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password_hash);
    }

    lockAccount(duration: number = 30): void {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + duration);
        this.locked_until = lockUntil;
    }

    // Hooks
    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password_hash && !this.password_hash.startsWith('$2b$')) {
            this.password_hash = await bcrypt.hash(this.password_hash, 12);
        }
    }
}
```

## 🗄️ Database Features

### **Advanced PostgreSQL Features**
```sql
-- Generated Constraints
ALTER TABLE products ADD CONSTRAINT chk_product_price_positive 
CHECK (price >= 0);

-- JSON/JSONB Support
CREATE INDEX idx_users_preferences_gin 
ON users USING gin(preferences);

-- Full-Text Search
CREATE INDEX idx_products_search_gin 
ON products USING gin(to_tsvector('english', name || ' ' || description));

-- Computed Columns
ALTER TABLE order_items ADD COLUMN total_price 
GENERATED ALWAYS AS (unit_price * quantity) STORED;
```

### **Indexing Strategy**
```typescript
// Composite Indexes
@Index(['user_id', 'status'])
@Index(['created_at', 'status'])
@Index(['email'], { unique: true })

// Partial Indexes
CREATE INDEX idx_active_products 
ON products(name) WHERE status = 'active';

// GIN Indexes for JSON
CREATE INDEX idx_metadata_gin 
ON products USING gin(metadata);
```

## 🔄 Migration Management

### **Automated Migration Generation**
```bash
# Generate migrations for all services
./scripts/generate-migrations.sh "AddUserPreferences" development

# Run migrations
./scripts/generate-migrations.sh "" development run

# Check migration status
./scripts/generate-migrations.sh "" development status
```

### **Migration Examples**

#### **.NET Migration**
```csharp
public partial class AddUserPreferences : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "preferences",
            table: "users",
            type: "jsonb",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_users_preferences",
            table: "users",
            column: "preferences")
            .Annotation("Npgsql:IndexMethod", "gin");
    }
}
```

#### **TypeORM Migration**
```typescript
export class AddUserPreferences1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("users", new TableColumn({
            name: "preferences",
            type: "jsonb",
            isNullable: true
        }));

        await queryRunner.createIndex("users", new Index({
            name: "IDX_users_preferences",
            columnNames: ["preferences"],
            using: "gin"
        }));
    }
}
```

#### **Go Migration**
```sql
-- 20231201120000_add_user_preferences.up.sql
ALTER TABLE users ADD COLUMN preferences JSONB;
CREATE INDEX idx_users_preferences_gin ON users USING gin(preferences);

-- 20231201120000_add_user_preferences.down.sql
DROP INDEX IF EXISTS idx_users_preferences_gin;
ALTER TABLE users DROP COLUMN IF EXISTS preferences;
```

## 🎯 Entity Relationships

### **One-to-Many Relationships**
```csharp
// .NET - User to Addresses
public class User : BaseEntity
{
    public virtual ICollection<UserAddress> Addresses { get; set; } = new List<UserAddress>();
}

public class UserAddress : BaseEntity
{
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;
}
```

```typescript
// TypeScript - Order to Items
@Entity('orders')
export class Order {
    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];
}

@Entity('order_items')
export class OrderItem {
    @ManyToOne(() => Order, (order) => order.items)
    @JoinColumn({ name: 'order_id' })
    order: Order;
}
```

```go
// Go - Product to Images
type Product struct {
    Images []ProductImage `gorm:"foreignKey:ProductID;constraint:OnDelete:CASCADE"`
}

type ProductImage struct {
    ProductID uuid.UUID `gorm:"type:uuid;not null;index"`
}
```

### **Many-to-Many Relationships**
```typescript
// User to Roles
@Entity('users')
export class User {
    @ManyToMany(() => Role, (role) => role.users)
    @JoinTable({
        name: 'user_roles',
        joinColumn: { name: 'user_id' },
        inverseJoinColumn: { name: 'role_id' }
    })
    roles: Role[];
}
```

## 🔧 Advanced Features

### **Soft Deletes**
```csharp
// .NET Implementation
public abstract class BaseEntity
{
    [Column("is_deleted")]
    public bool IsDeleted { get; set; } = false;

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }

    public void SoftDelete(string? deletedBy = null)
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        DeletedBy = deletedBy;
    }
}

// Global Query Filter
modelBuilder.Entity<User>()
    .HasQueryFilter(e => !e.IsDeleted);
```

### **Optimistic Concurrency**
```typescript
// TypeORM Version Control
@Entity('users')
export class User {
    @Column({ type: 'int', default: 1 })
    version: number;

    @BeforeUpdate()
    updateVersion() {
        this.version += 1;
    }
}
```

### **Audit Trails**
```go
// GORM Audit Fields
type BaseEntity struct {
    CreatedAt time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
    UpdatedAt time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
    CreatedBy *string   `gorm:"type:varchar(255)"`
    UpdatedBy *string   `gorm:"type:varchar(255)"`
    Version   int       `gorm:"default:1"`
}

func (base *BaseEntity) BeforeUpdate(tx *gorm.DB) error {
    base.UpdatedAt = time.Now()
    base.Version++
    return nil
}
```

## 📊 Performance Optimizations

### **Database Indexing**
```sql
-- Composite indexes for common queries
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_products_category_price ON products(category_id, price) WHERE status = 'active';

-- Partial indexes for filtered queries
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';

-- GIN indexes for JSON queries
CREATE INDEX idx_product_attributes_gin ON products USING gin(attributes);
```

### **Query Optimization**
```csharp
// .NET - Eager Loading
var users = await context.Users
    .Include(u => u.Addresses.Where(a => a.IsDefault))
    .Include(u => u.Roles)
    .Where(u => u.Status == UserStatus.Active)
    .ToListAsync();

// Projection for performance
var userSummaries = await context.Users
    .Select(u => new UserSummaryDto
    {
        Id = u.Id,
        FullName = u.FirstName + " " + u.LastName,
        Email = u.Email
    })
    .ToListAsync();
```

### **Connection Pooling**
```typescript
// TypeORM Connection Pool
export const AppDataSource = new DataSource({
    type: 'postgres',
    extra: {
        max: 20,           // Maximum connections
        min: 5,            // Minimum connections
        idle: 10000,       // Idle timeout
        acquire: 60000,    // Acquire timeout
        evict: 1000,       // Eviction interval
    }
});
```

## 🧪 Testing Strategy

### **Unit Testing Entities**
```csharp
[Test]
public void User_LockAccount_ShouldSetLockUntil()
{
    // Arrange
    var user = new User { Email = "test@example.com" };
    
    // Act
    user.LockAccount(TimeSpan.FromMinutes(30));
    
    // Assert
    Assert.That(user.IsLocked, Is.True);
    Assert.That(user.LockedUntil, Is.Not.Null);
}
```

### **Integration Testing**
```typescript
describe('UserRepository', () => {
    it('should create user with encrypted password', async () => {
        const user = new User();
        user.email = 'test@example.com';
        user.password_hash = 'plaintext';
        
        const savedUser = await userRepository.save(user);
        
        expect(savedUser.password_hash).not.toBe('plaintext');
        expect(await savedUser.validatePassword('plaintext')).toBe(true);
    });
});
```

## 🚀 Deployment

### **Environment-Specific Configurations**
```bash
# Development
DB_SYNCHRONIZE=false
DB_LOGGING=true
DB_POOL_MAX=10

# Production
DB_SYNCHRONIZE=false
DB_LOGGING=false
DB_POOL_MAX=50
DB_SSL_ENABLED=true
```

### **Migration Deployment**
```bash
# Production deployment
./scripts/generate-migrations.sh "" production run

# Rollback if needed
./scripts/generate-migrations.sh "" production revert
```

## 📈 Monitoring

### **Database Health Checks**
```typescript
@Get('/health/database')
async getDatabaseHealth() {
    const healthInfo = await databaseConnection.getHealthInfo();
    return {
        status: healthInfo.status,
        database: healthInfo.database,
        migrations: healthInfo.migrations,
        cache: healthInfo.cache
    };
}
```

### **Performance Metrics**
```csharp
// .NET Performance Counters
services.AddDbContext<UserDbContext>(options =>
{
    options.UseNpgsql(connectionString)
           .EnableSensitiveDataLogging(isDevelopment)
           .EnableServiceProviderCaching()
           .EnableDetailedErrors(isDevelopment);
});
```

## 🎯 Best Practices

### **Entity Design**
- ✅ Rich domain models with business logic
- ✅ Value objects for complex types
- ✅ Proper encapsulation and validation
- ✅ Meaningful relationships and constraints

### **Migration Management**
- ✅ Descriptive migration names
- ✅ Reversible migrations
- ✅ Data migration scripts
- ✅ Environment-specific configurations

### **Performance**
- ✅ Strategic indexing
- ✅ Query optimization
- ✅ Connection pooling
- ✅ Caching strategies

---

## 🎉 **Code-First Implementation Complete!**

Your backend services now feature:

🏗️ **Rich Domain Models** - Business logic embedded in entities  
🔄 **Automatic Migrations** - Schema changes tracked in code  
🎯 **Type Safety** - Compile-time validation across all layers  
📊 **Advanced Database Features** - JSON, full-text search, constraints  
🚀 **Production Ready** - Connection pooling, monitoring, health checks  

**All services are now fully code-first with enterprise-grade implementations!** 🚀
