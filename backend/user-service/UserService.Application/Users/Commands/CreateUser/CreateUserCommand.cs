using MediatR;
using UserService.Application.Common.Models;
using UserService.Application.Users.Common;
using UserService.Domain.Entities;

namespace UserService.Application.Users.Commands.CreateUser;

public class CreateUserCommand : IRequest<Result<UserDto>>
{
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public string? ProfileImageUrl { get; set; }
    public UserPreferencesDto? Preferences { get; set; }
    public List<string> Roles { get; set; } = new();
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
