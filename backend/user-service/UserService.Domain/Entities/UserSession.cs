using UserService.Domain.Common;

namespace UserService.Domain.Entities;

public class UserSession : BaseEntity
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string SessionToken { get; private set; }
    public string RefreshToken { get; private set; }
    public string DeviceInfo { get; private set; }
    public string IpAddress { get; private set; }
    public string UserAgent { get; private set; }
    public string? Location { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? LastAccessedAt { get; private set; }
    public bool IsActive { get; private set; }
    public SessionType Type { get; private set; }
    public Dictionary<string, object> Metadata { get; private set; }

    // Navigation properties
    public User User { get; private set; } = null!;

    private UserSession() 
    {
        Metadata = new Dictionary<string, object>();
    } // EF Core constructor

    public UserSession(
        Guid userId,
        string sessionToken,
        string refreshToken,
        string deviceInfo,
        string ipAddress,
        string userAgent,
        TimeSpan sessionDuration,
        SessionType type = SessionType.Web,
        string? location = null,
        Dictionary<string, object>? metadata = null)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        SessionToken = sessionToken ?? throw new ArgumentNullException(nameof(sessionToken));
        RefreshToken = refreshToken ?? throw new ArgumentNullException(nameof(refreshToken));
        DeviceInfo = deviceInfo ?? throw new ArgumentNullException(nameof(deviceInfo));
        IpAddress = ipAddress ?? throw new ArgumentNullException(nameof(ipAddress));
        UserAgent = userAgent ?? throw new ArgumentNullException(nameof(userAgent));
        Location = location;
        Type = type;
        CreatedAt = DateTime.UtcNow;
        ExpiresAt = DateTime.UtcNow.Add(sessionDuration);
        LastAccessedAt = DateTime.UtcNow;
        IsActive = true;
        Metadata = metadata ?? new Dictionary<string, object>();

        ValidateSession();
    }

    public void RefreshSession(string newSessionToken, string newRefreshToken, TimeSpan sessionDuration)
    {
        if (!IsActive)
            throw new InvalidOperationException("Cannot refresh inactive session");

        if (IsExpired())
            throw new InvalidOperationException("Cannot refresh expired session");

        SessionToken = newSessionToken ?? throw new ArgumentNullException(nameof(newSessionToken));
        RefreshToken = newRefreshToken ?? throw new ArgumentNullException(nameof(newRefreshToken));
        ExpiresAt = DateTime.UtcNow.Add(sessionDuration);
        LastAccessedAt = DateTime.UtcNow;
    }

    public void UpdateLastAccessed()
    {
        if (!IsActive)
            return;

        LastAccessedAt = DateTime.UtcNow;
    }

    public void UpdateLocation(string location)
    {
        Location = location;
        LastAccessedAt = DateTime.UtcNow;
    }

    public void Terminate()
    {
        IsActive = false;
        LastAccessedAt = DateTime.UtcNow;
    }

    public void ExtendSession(TimeSpan additionalTime)
    {
        if (!IsActive)
            throw new InvalidOperationException("Cannot extend inactive session");

        ExpiresAt = ExpiresAt.Add(additionalTime);
        LastAccessedAt = DateTime.UtcNow;
    }

    public bool IsExpired()
    {
        return DateTime.UtcNow > ExpiresAt;
    }

    public bool IsValid()
    {
        return IsActive && !IsExpired();
    }

    public TimeSpan GetRemainingTime()
    {
        if (IsExpired())
            return TimeSpan.Zero;

        return ExpiresAt - DateTime.UtcNow;
    }

    public TimeSpan GetSessionDuration()
    {
        var endTime = LastAccessedAt ?? DateTime.UtcNow;
        return endTime - CreatedAt;
    }

    public void SetMetadata(string key, object value)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Metadata key cannot be empty", nameof(key));

        Metadata[key] = value;
        LastAccessedAt = DateTime.UtcNow;
    }

    public T? GetMetadata<T>(string key)
    {
        if (Metadata.TryGetValue(key, out var value) && value is T typedValue)
            return typedValue;
        return default;
    }

    public void RemoveMetadata(string key)
    {
        Metadata.Remove(key);
    }

    public bool IsSameDevice(string deviceInfo, string userAgent)
    {
        return DeviceInfo.Equals(deviceInfo, StringComparison.OrdinalIgnoreCase) &&
               UserAgent.Equals(userAgent, StringComparison.OrdinalIgnoreCase);
    }

    public bool IsSameLocation(string ipAddress)
    {
        return IpAddress.Equals(ipAddress, StringComparison.OrdinalIgnoreCase);
    }

    public SessionInfo GetSessionInfo()
    {
        return new SessionInfo
        {
            Id = Id,
            DeviceInfo = DeviceInfo,
            IpAddress = IpAddress,
            Location = Location,
            CreatedAt = CreatedAt,
            LastAccessedAt = LastAccessedAt,
            ExpiresAt = ExpiresAt,
            IsActive = IsActive,
            Type = Type,
            IsExpired = IsExpired(),
            RemainingTime = GetRemainingTime(),
            SessionDuration = GetSessionDuration()
        };
    }

    private void ValidateSession()
    {
        if (string.IsNullOrWhiteSpace(SessionToken))
            throw new ArgumentException("Session token is required", nameof(SessionToken));

        if (string.IsNullOrWhiteSpace(RefreshToken))
            throw new ArgumentException("Refresh token is required", nameof(RefreshToken));

        if (string.IsNullOrWhiteSpace(DeviceInfo))
            throw new ArgumentException("Device info is required", nameof(DeviceInfo));

        if (string.IsNullOrWhiteSpace(IpAddress))
            throw new ArgumentException("IP address is required", nameof(IpAddress));

        if (string.IsNullOrWhiteSpace(UserAgent))
            throw new ArgumentException("User agent is required", nameof(UserAgent));

        if (ExpiresAt <= CreatedAt)
            throw new ArgumentException("Session expiry must be after creation time");

        // Validate IP address format
        if (!System.Net.IPAddress.TryParse(IpAddress, out _))
            throw new ArgumentException("Invalid IP address format", nameof(IpAddress));
    }

    // Static factory methods for different session types
    public static UserSession CreateWebSession(
        Guid userId,
        string sessionToken,
        string refreshToken,
        string ipAddress,
        string userAgent,
        TimeSpan? duration = null)
    {
        var sessionDuration = duration ?? TimeSpan.FromHours(24);
        var deviceInfo = ExtractDeviceInfo(userAgent);

        return new UserSession(
            userId,
            sessionToken,
            refreshToken,
            deviceInfo,
            ipAddress,
            userAgent,
            sessionDuration,
            SessionType.Web);
    }

    public static UserSession CreateMobileSession(
        Guid userId,
        string sessionToken,
        string refreshToken,
        string deviceInfo,
        string ipAddress,
        string userAgent,
        TimeSpan? duration = null)
    {
        var sessionDuration = duration ?? TimeSpan.FromDays(30); // Longer for mobile

        return new UserSession(
            userId,
            sessionToken,
            refreshToken,
            deviceInfo,
            ipAddress,
            userAgent,
            sessionDuration,
            SessionType.Mobile);
    }

    public static UserSession CreateApiSession(
        Guid userId,
        string sessionToken,
        string refreshToken,
        string apiClientInfo,
        string ipAddress,
        TimeSpan? duration = null)
    {
        var sessionDuration = duration ?? TimeSpan.FromHours(1); // Shorter for API

        return new UserSession(
            userId,
            sessionToken,
            refreshToken,
            apiClientInfo,
            ipAddress,
            "API Client",
            sessionDuration,
            SessionType.Api);
    }

    private static string ExtractDeviceInfo(string userAgent)
    {
        // Simple device detection - in production, use a proper library
        if (userAgent.Contains("Mobile", StringComparison.OrdinalIgnoreCase))
            return "Mobile Device";
        if (userAgent.Contains("Tablet", StringComparison.OrdinalIgnoreCase))
            return "Tablet";
        if (userAgent.Contains("Windows", StringComparison.OrdinalIgnoreCase))
            return "Windows PC";
        if (userAgent.Contains("Mac", StringComparison.OrdinalIgnoreCase))
            return "Mac";
        if (userAgent.Contains("Linux", StringComparison.OrdinalIgnoreCase))
            return "Linux PC";

        return "Unknown Device";
    }
}

public enum SessionType
{
    Web = 1,
    Mobile = 2,
    Api = 3,
    Admin = 4
}

public class SessionInfo
{
    public Guid Id { get; set; }
    public string DeviceInfo { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string? Location { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastAccessedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public SessionType Type { get; set; }
    public bool IsExpired { get; set; }
    public TimeSpan RemainingTime { get; set; }
    public TimeSpan SessionDuration { get; set; }
}
