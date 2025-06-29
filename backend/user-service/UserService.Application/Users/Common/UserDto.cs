using UserService.Domain.Entities;

namespace UserService.Application.Users.Common;

public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public int? Age { get; set; }
    public Gender? Gender { get; set; }
    public UserStatus Status { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }
    public DateTime? PhoneVerifiedAt { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsPhoneVerified { get; set; }
    public bool IsActive { get; set; }
    public string? ProfileImageUrl { get; set; }
    public UserPreferencesDto Preferences { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }

    // Navigation properties
    public List<UserAddressDto> Addresses { get; set; } = new();
    public List<UserRoleDto> Roles { get; set; } = new();
    public List<UserSessionDto> Sessions { get; set; } = new();
}

public class UserAddressDto
{
    public Guid Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string FullAddress { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public AddressType Type { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool HasCoordinates { get; set; }
    public string? DeliveryInstructions { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
}

public class UserRoleDto
{
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string RoleDescription { get; set; } = string.Empty;
    public int Priority { get; set; }
    public DateTime AssignedAt { get; set; }
    public Guid? AssignedBy { get; set; }
    public List<PermissionDto> Permissions { get; set; } = new();
}

public class PermissionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class UserSessionDto
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

public class UserPreferencesDto
{
    public string Language { get; set; } = "en";
    public string Currency { get; set; } = "USD";
    public string TimeZone { get; set; } = "UTC";
    public NotificationSettingsDto NotificationSettings { get; set; } = new();
    public PrivacySettingsDto PrivacySettings { get; set; } = new();
    public Dictionary<string, object> CustomSettings { get; set; } = new();
}

public class NotificationSettingsDto
{
    public bool EmailNotifications { get; set; } = true;
    public bool SmsNotifications { get; set; } = false;
    public bool PushNotifications { get; set; } = true;
    public bool MarketingEmails { get; set; } = false;
    public bool OrderUpdates { get; set; } = true;
    public bool SecurityAlerts { get; set; } = true;
    public bool NewsletterSubscription { get; set; } = false;
}

public class PrivacySettingsDto
{
    public bool ProfileVisibility { get; set; } = true;
    public bool ShowOnlineStatus { get; set; } = false;
    public bool AllowDataCollection { get; set; } = true;
    public bool AllowPersonalization { get; set; } = true;
    public bool AllowThirdPartySharing { get; set; } = false;
}

public class UserSummaryDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserStatus Status { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsPhoneVerified { get; set; }
    public string? ProfileImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Roles { get; set; } = new();
}

public class CreateUserAddressDto
{
    public string Label { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string AddressLine1 { get; set; } = string.Empty;
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public AddressType Type { get; set; } = AddressType.Shipping;
    public bool IsDefault { get; set; } = false;
    public string? DeliveryInstructions { get; set; }
}

public class UpdateUserAddressDto : CreateUserAddressDto
{
    public Guid Id { get; set; }
}
