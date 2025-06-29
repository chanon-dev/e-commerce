using UserService.Domain.Common;

namespace UserService.Domain.Entities;

public class Role : BaseAuditableEntity
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public bool IsActive { get; private set; }
    public bool IsSystemRole { get; private set; }
    public int Priority { get; private set; } // Higher number = higher priority

    // Navigation properties
    public ICollection<UserRole> UserRoles { get; private set; } = new List<UserRole>();
    public ICollection<RolePermission> RolePermissions { get; private set; } = new List<RolePermission>();

    private Role() { } // EF Core constructor

    public Role(string name, string description, int priority = 0, bool isSystemRole = false)
    {
        Id = Guid.NewGuid();
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Description = description ?? throw new ArgumentNullException(nameof(description));
        Priority = priority;
        IsActive = true;
        IsSystemRole = isSystemRole;

        ValidateRole();
    }

    public void UpdateRole(string name, string description, int priority)
    {
        if (IsSystemRole)
            throw new InvalidOperationException("Cannot modify system roles");

        Name = name ?? throw new ArgumentNullException(nameof(name));
        Description = description ?? throw new ArgumentNullException(nameof(description));
        Priority = priority;

        ValidateRole();
        UpdateModifiedDate();
    }

    public void Activate()
    {
        IsActive = true;
        UpdateModifiedDate();
    }

    public void Deactivate()
    {
        if (IsSystemRole)
            throw new InvalidOperationException("Cannot deactivate system roles");

        IsActive = false;
        UpdateModifiedDate();
    }

    public void AddPermission(Permission permission)
    {
        if (permission == null)
            throw new ArgumentNullException(nameof(permission));

        if (!RolePermissions.Any(rp => rp.PermissionId == permission.Id))
        {
            RolePermissions.Add(new RolePermission(Id, permission.Id));
            UpdateModifiedDate();
        }
    }

    public void RemovePermission(Guid permissionId)
    {
        if (IsSystemRole)
            throw new InvalidOperationException("Cannot modify permissions for system roles");

        var rolePermission = RolePermissions.FirstOrDefault(rp => rp.PermissionId == permissionId);
        if (rolePermission != null)
        {
            RolePermissions.Remove(rolePermission);
            UpdateModifiedDate();
        }
    }

    public bool HasPermission(string permissionName)
    {
        return RolePermissions.Any(rp => 
            rp.Permission.Name.Equals(permissionName, StringComparison.OrdinalIgnoreCase) &&
            rp.Permission.IsActive);
    }

    public IEnumerable<Permission> GetActivePermissions()
    {
        return RolePermissions
            .Where(rp => rp.Permission.IsActive)
            .Select(rp => rp.Permission);
    }

    private void ValidateRole()
    {
        if (string.IsNullOrWhiteSpace(Name))
            throw new ArgumentException("Role name is required", nameof(Name));

        if (Name.Length > 100)
            throw new ArgumentException("Role name cannot exceed 100 characters", nameof(Name));

        if (string.IsNullOrWhiteSpace(Description))
            throw new ArgumentException("Role description is required", nameof(Description));

        if (Description.Length > 500)
            throw new ArgumentException("Role description cannot exceed 500 characters", nameof(Description));

        if (Priority < 0)
            throw new ArgumentException("Role priority cannot be negative", nameof(Priority));
    }

    // Static factory methods for common roles
    public static Role CreateAdminRole()
    {
        return new Role("Administrator", "Full system access", 1000, true);
    }

    public static Role CreateCustomerRole()
    {
        return new Role("Customer", "Standard customer access", 100, true);
    }

    public static Role CreateManagerRole()
    {
        return new Role("Manager", "Management access", 500, true);
    }

    public static Role CreateSupportRole()
    {
        return new Role("Support", "Customer support access", 300, true);
    }
}

public class UserRole : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid RoleId { get; private set; }
    public DateTime AssignedAt { get; private set; }
    public Guid? AssignedBy { get; private set; }

    // Navigation properties
    public User User { get; private set; } = null!;
    public Role Role { get; private set; } = null!;

    private UserRole() { } // EF Core constructor

    public UserRole(Guid userId, Guid roleId, Guid? assignedBy = null)
    {
        UserId = userId;
        RoleId = roleId;
        AssignedAt = DateTime.UtcNow;
        AssignedBy = assignedBy;
    }
}

public class Permission : BaseAuditableEntity
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public string Category { get; private set; }
    public bool IsActive { get; private set; }

    // Navigation properties
    public ICollection<RolePermission> RolePermissions { get; private set; } = new List<RolePermission>();

    private Permission() { } // EF Core constructor

    public Permission(string name, string description, string category)
    {
        Id = Guid.NewGuid();
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Description = description ?? throw new ArgumentNullException(nameof(description));
        Category = category ?? throw new ArgumentNullException(nameof(category));
        IsActive = true;

        ValidatePermission();
    }

    public void UpdatePermission(string name, string description, string category)
    {
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Description = description ?? throw new ArgumentNullException(nameof(description));
        Category = category ?? throw new ArgumentNullException(nameof(category));

        ValidatePermission();
        UpdateModifiedDate();
    }

    public void Activate()
    {
        IsActive = true;
        UpdateModifiedDate();
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdateModifiedDate();
    }

    private void ValidatePermission()
    {
        if (string.IsNullOrWhiteSpace(Name))
            throw new ArgumentException("Permission name is required", nameof(Name));

        if (Name.Length > 100)
            throw new ArgumentException("Permission name cannot exceed 100 characters", nameof(Name));

        if (string.IsNullOrWhiteSpace(Description))
            throw new ArgumentException("Permission description is required", nameof(Description));

        if (string.IsNullOrWhiteSpace(Category))
            throw new ArgumentException("Permission category is required", nameof(Category));
    }

    // Static factory methods for common permissions
    public static class CommonPermissions
    {
        public static Permission CreateUserRead() => new("user.read", "Read user information", "User Management");
        public static Permission CreateUserWrite() => new("user.write", "Create and update users", "User Management");
        public static Permission CreateUserDelete() => new("user.delete", "Delete users", "User Management");
        public static Permission CreateOrderRead() => new("order.read", "Read order information", "Order Management");
        public static Permission CreateOrderWrite() => new("order.write", "Create and update orders", "Order Management");
        public static Permission CreateProductRead() => new("product.read", "Read product information", "Product Management");
        public static Permission CreateProductWrite() => new("product.write", "Create and update products", "Product Management");
        public static Permission CreateAdminAccess() => new("admin.access", "Access admin panel", "Administration");
    }
}

public class RolePermission : BaseEntity
{
    public Guid RoleId { get; private set; }
    public Guid PermissionId { get; private set; }
    public DateTime GrantedAt { get; private set; }
    public Guid? GrantedBy { get; private set; }

    // Navigation properties
    public Role Role { get; private set; } = null!;
    public Permission Permission { get; private set; } = null!;

    private RolePermission() { } // EF Core constructor

    public RolePermission(Guid roleId, Guid permissionId, Guid? grantedBy = null)
    {
        RoleId = roleId;
        PermissionId = permissionId;
        GrantedAt = DateTime.UtcNow;
        GrantedBy = grantedBy;
    }
}
