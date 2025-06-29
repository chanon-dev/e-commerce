using Microsoft.EntityFrameworkCore;
using UserService.Domain.Entities;

namespace UserService.Infrastructure.Data;

public class UserDbContext : DbContext
{
    public UserDbContext(DbContextOptions<UserDbContext> options) : base(options)
    {
    }

    // DbSets
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<UserAddress> UserAddresses { get; set; } = null!;
    public DbSet<UserRole> UserRoles { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<UserSession> UserSessions { get; set; } = null!;
    public DbSet<UserPreference> UserPreferences { get; set; } = null!;
    public DbSet<SocialLogin> SocialLogins { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            // Indexes
            entity.HasIndex(e => e.Email)
                .IsUnique()
                .HasDatabaseName("IX_users_email");

            entity.HasIndex(e => e.PhoneNumber)
                .HasDatabaseName("IX_users_phone_number");

            entity.HasIndex(e => new { e.Status, e.IsDeleted })
                .HasDatabaseName("IX_users_status_deleted");

            entity.HasIndex(e => e.CreatedAt)
                .HasDatabaseName("IX_users_created_at");

            // Constraints
            entity.HasCheckConstraint("CK_users_email_format", 
                "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'");

            entity.HasCheckConstraint("CK_users_login_attempts", 
                "login_attempts >= 0 AND login_attempts <= 10");

            // Default values
            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // JSON columns for PostgreSQL
            entity.Property(e => e.Preferences)
                .HasColumnType("jsonb");

            entity.Property(e => e.Metadata)
                .HasColumnType("jsonb");

            // Enum conversion
            entity.Property(e => e.Status)
                .HasConversion<string>();

            // Soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure UserAddress entity
        modelBuilder.Entity<UserAddress>(entity =>
        {
            // Relationships
            entity.HasOne(e => e.User)
                .WithMany(e => e.Addresses)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("IX_user_addresses_user_id");

            entity.HasIndex(e => new { e.UserId, e.Type })
                .HasDatabaseName("IX_user_addresses_user_type");

            entity.HasIndex(e => new { e.UserId, e.IsDefault })
                .HasDatabaseName("IX_user_addresses_user_default");

            // Constraints
            entity.HasCheckConstraint("CK_user_addresses_postal_code", 
                "LENGTH(postal_code) >= 3");

            entity.HasCheckConstraint("CK_user_addresses_country", 
                "LENGTH(country) = 2");

            entity.HasCheckConstraint("CK_user_addresses_coordinates",
                "latitude IS NULL OR (latitude >= -90 AND latitude <= 90) AND " +
                "longitude IS NULL OR (longitude >= -180 AND longitude <= 180)");

            // Default values
            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            // Enum conversion
            entity.Property(e => e.Type)
                .HasConversion<string>();

            // Soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure UserRole entity
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RoleId });

            entity.HasOne(e => e.User)
                .WithMany(e => e.UserRoles)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Role)
                .WithMany(e => e.UserRoles)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("IX_user_roles_user_id");

            entity.HasIndex(e => e.RoleId)
                .HasDatabaseName("IX_user_roles_role_id");

            // Soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure Role entity
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasIndex(e => e.Name)
                .IsUnique()
                .HasDatabaseName("IX_roles_name");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            // Soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure UserSession entity
        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.HasOne(e => e.User)
                .WithMany(e => e.Sessions)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("IX_user_sessions_user_id");

            entity.HasIndex(e => e.SessionToken)
                .IsUnique()
                .HasDatabaseName("IX_user_sessions_token");

            entity.HasIndex(e => e.ExpiresAt)
                .HasDatabaseName("IX_user_sessions_expires");

            entity.HasIndex(e => new { e.UserId, e.IsActive })
                .HasDatabaseName("IX_user_sessions_user_active");

            // Constraints
            entity.HasCheckConstraint("CK_user_sessions_expires", 
                "expires_at > created_at");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            // Soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure UserPreference entity
        modelBuilder.Entity<UserPreference>(entity =>
        {
            entity.HasOne(e => e.User)
                .WithMany(e => e.UserPreferences)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("IX_user_preferences_user_id");

            entity.HasIndex(e => new { e.UserId, e.Key })
                .IsUnique()
                .HasDatabaseName("IX_user_preferences_user_key");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            // Soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure SocialLogin entity
        modelBuilder.Entity<SocialLogin>(entity =>
        {
            entity.HasOne(e => e.User)
                .WithMany(e => e.SocialLogins)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("IX_social_logins_user_id");

            entity.HasIndex(e => new { e.Provider, e.ProviderId })
                .IsUnique()
                .HasDatabaseName("IX_social_logins_provider");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            // Enum conversion
            entity.Property(e => e.Provider)
                .HasConversion<string>();

            // Soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Global configurations
        ConfigureGlobalSettings(modelBuilder);
        SeedData(modelBuilder);
    }

    private void ConfigureGlobalSettings(ModelBuilder modelBuilder)
    {
        // Configure all decimal properties
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(decimal) || property.ClrType == typeof(decimal?))
                {
                    property.SetColumnType("decimal(18,2)");
                }
            }
        }

        // Configure all string properties
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(string) && property.GetMaxLength() == null)
                {
                    property.SetMaxLength(255);
                }
            }
        }
    }

    private void SeedData(ModelBuilder modelBuilder)
    {
        // Seed default roles
        var adminRoleId = Guid.NewGuid();
        var userRoleId = Guid.NewGuid();
        var moderatorRoleId = Guid.NewGuid();

        modelBuilder.Entity<Role>().HasData(
            new Role
            {
                Id = adminRoleId,
                Name = "Administrator",
                Description = "Full system access",
                CreatedAt = DateTime.UtcNow
            },
            new Role
            {
                Id = userRoleId,
                Name = "User",
                Description = "Standard user access",
                CreatedAt = DateTime.UtcNow
            },
            new Role
            {
                Id = moderatorRoleId,
                Name = "Moderator",
                Description = "Content moderation access",
                CreatedAt = DateTime.UtcNow
            }
        );
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return await base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is BaseEntity && (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entry in entries)
        {
            var entity = (BaseEntity)entry.Entity;

            if (entry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.UtcNow;
            }

            entity.UpdatedAt = DateTime.UtcNow;
        }
    }
}
