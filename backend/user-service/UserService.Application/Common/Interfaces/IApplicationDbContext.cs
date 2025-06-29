using Microsoft.EntityFrameworkCore;
using UserService.Domain.Entities;

namespace UserService.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<UserAddress> UserAddresses { get; }
    DbSet<UserSession> UserSessions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(string userId, CancellationToken cancellationToken = default);
}

public interface IUnitOfWork
{
    IUserRepository Users { get; }
    IRoleRepository Roles { get; }
    IPermissionRepository Permissions { get; }
    IUserSessionRepository Sessions { get; }
    IUserAddressRepository Addresses { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(string userId, CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}

public interface IDomainEventService
{
    Task PublishAsync(Domain.Common.IDomainEvent domainEvent, CancellationToken cancellationToken = default);
    Task PublishAsync(IEnumerable<Domain.Common.IDomainEvent> domainEvents, CancellationToken cancellationToken = default);
}

public interface ICurrentUserService
{
    string? UserId { get; }
    string? Email { get; }
    string? Name { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(string role);
    bool HasPermission(string permission);
    IEnumerable<string> GetRoles();
    IEnumerable<string> GetPermissions();
}

public interface IDateTimeService
{
    DateTime Now { get; }
    DateTime UtcNow { get; }
    DateTimeOffset OffsetNow { get; }
    DateTimeOffset UtcOffsetNow { get; }
}

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, CancellationToken cancellationToken = default);
    Task SendEmailAsync(string to, string subject, string body, bool isHtml, CancellationToken cancellationToken = default);
    Task SendTemplateEmailAsync(string to, string templateName, object model, CancellationToken cancellationToken = default);
    Task SendVerificationEmailAsync(string to, string verificationLink, CancellationToken cancellationToken = default);
    Task SendPasswordResetEmailAsync(string to, string resetLink, CancellationToken cancellationToken = default);
    Task SendWelcomeEmailAsync(string to, string firstName, CancellationToken cancellationToken = default);
}

public interface ISmsService
{
    Task SendSmsAsync(string phoneNumber, string message, CancellationToken cancellationToken = default);
    Task SendVerificationSmsAsync(string phoneNumber, string code, CancellationToken cancellationToken = default);
    Task SendPasswordResetSmsAsync(string phoneNumber, string code, CancellationToken cancellationToken = default);
}

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    string GenerateEmailVerificationToken(User user);
    string GeneratePhoneVerificationToken(User user);
    string GeneratePasswordResetToken(User user);
    bool ValidateToken(string token, out Guid userId);
    bool ValidateEmailVerificationToken(string token, out Guid userId);
    bool ValidatePhoneVerificationToken(string token, out Guid userId);
    bool ValidatePasswordResetToken(string token, out Guid userId);
    TimeSpan GetTokenExpiry(string token);
}

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class;
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default) where T : class;
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
    Task RemovePatternAsync(string pattern, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default);
}

public interface IFileStorageService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<string> UploadProfileImageAsync(Stream imageStream, string fileName, Guid userId, CancellationToken cancellationToken = default);
    Task<Stream> DownloadAsync(string fileUrl, CancellationToken cancellationToken = default);
    Task DeleteAsync(string fileUrl, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string fileUrl, CancellationToken cancellationToken = default);
}

public interface IGeolocationService
{
    Task<GeolocationResult?> GetLocationAsync(string ipAddress, CancellationToken cancellationToken = default);
    Task<GeolocationResult?> GetLocationAsync(double latitude, double longitude, CancellationToken cancellationToken = default);
    Task<double> CalculateDistanceAsync(double lat1, double lon1, double lat2, double lon2);
}

public class GeolocationResult
{
    public string Country { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string TimeZone { get; set; } = string.Empty;
}
