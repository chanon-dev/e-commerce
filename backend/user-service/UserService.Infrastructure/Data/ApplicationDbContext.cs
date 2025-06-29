using Microsoft.EntityFrameworkCore;
using System.Reflection;
using UserService.Application.Common.Interfaces;
using UserService.Domain.Common;
using UserService.Domain.Entities;

namespace UserService.Infrastructure.Data;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeService _dateTimeService;
    private readonly IDomainEventService _domainEventService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService,
        IDateTimeService dateTimeService,
        IDomainEventService domainEventService) : base(options)
    {
        _currentUserService = currentUserService;
        _dateTimeService = dateTimeService;
        _domainEventService = domainEventService;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await SaveChangesAsync(_currentUserService.UserId, cancellationToken);
    }

    public async Task<int> SaveChangesAsync(string? userId, CancellationToken cancellationToken = default)
    {
        // Update audit fields
        foreach (var entry in ChangeTracker.Entries<BaseAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.SetCreatedBy(userId ?? "System");
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdateModifiedDate(userId ?? "System");
                    break;
            }
        }

        // Collect domain events
        var domainEvents = ChangeTracker.Entries<BaseEntity>()
            .Where(x => x.Entity.DomainEvents.Any())
            .SelectMany(x => x.Entity.DomainEvents)
            .ToList();

        // Save changes
        var result = await base.SaveChangesAsync(cancellationToken);

        // Publish domain events after successful save
        if (domainEvents.Any())
        {
            await _domainEventService.PublishAsync(domainEvents, cancellationToken);

            // Clear domain events
            foreach (var entity in ChangeTracker.Entries<BaseEntity>().Select(x => x.Entity))
            {
                entity.ClearDomainEvents();
            }
        }

        return result;
    }
}
