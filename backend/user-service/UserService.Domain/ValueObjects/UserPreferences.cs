namespace UserService.Domain.ValueObjects;

public class UserPreferences : IEquatable<UserPreferences>
{
    public string Language { get; private set; }
    public string Currency { get; private set; }
    public string TimeZone { get; private set; }
    public NotificationSettings NotificationSettings { get; private set; }
    public PrivacySettings PrivacySettings { get; private set; }
    public Dictionary<string, object> CustomSettings { get; private set; }

    private UserPreferences() 
    {
        // EF Core constructor with defaults
        Language = "en";
        Currency = "USD";
        TimeZone = "UTC";
        NotificationSettings = new NotificationSettings();
        PrivacySettings = new PrivacySettings();
        CustomSettings = new Dictionary<string, object>();
    }

    public UserPreferences(
        string language = "en",
        string currency = "USD",
        string timeZone = "UTC",
        NotificationSettings? notificationSettings = null,
        PrivacySettings? privacySettings = null,
        Dictionary<string, object>? customSettings = null)
    {
        Language = ValidateLanguage(language);
        Currency = ValidateCurrency(currency);
        TimeZone = ValidateTimeZone(timeZone);
        NotificationSettings = notificationSettings ?? new NotificationSettings();
        PrivacySettings = privacySettings ?? new PrivacySettings();
        CustomSettings = customSettings ?? new Dictionary<string, object>();
    }

    public void UpdateLanguage(string language)
    {
        Language = ValidateLanguage(language);
    }

    public void UpdateCurrency(string currency)
    {
        Currency = ValidateCurrency(currency);
    }

    public void UpdateTimeZone(string timeZone)
    {
        TimeZone = ValidateTimeZone(timeZone);
    }

    public void UpdateNotificationSettings(NotificationSettings settings)
    {
        NotificationSettings = settings ?? throw new ArgumentNullException(nameof(settings));
    }

    public void UpdatePrivacySettings(PrivacySettings settings)
    {
        PrivacySettings = settings ?? throw new ArgumentNullException(nameof(settings));
    }

    public void SetCustomSetting(string key, object value)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Setting key cannot be empty", nameof(key));

        CustomSettings[key] = value;
    }

    public T? GetCustomSetting<T>(string key)
    {
        if (CustomSettings.TryGetValue(key, out var value) && value is T typedValue)
            return typedValue;
        return default;
    }

    public void RemoveCustomSetting(string key)
    {
        CustomSettings.Remove(key);
    }

    private static string ValidateLanguage(string language)
    {
        if (string.IsNullOrWhiteSpace(language))
            throw new ArgumentException("Language cannot be empty", nameof(language));

        var supportedLanguages = new[] { "en", "th", "ja", "ko", "zh", "es", "fr", "de" };
        language = language.ToLowerInvariant();

        if (!supportedLanguages.Contains(language))
            throw new ArgumentException($"Unsupported language: {language}", nameof(language));

        return language;
    }

    private static string ValidateCurrency(string currency)
    {
        if (string.IsNullOrWhiteSpace(currency))
            throw new ArgumentException("Currency cannot be empty", nameof(currency));

        var supportedCurrencies = new[] { "USD", "THB", "EUR", "GBP", "JPY", "KRW", "SGD", "MYR" };
        currency = currency.ToUpperInvariant();

        if (!supportedCurrencies.Contains(currency))
            throw new ArgumentException($"Unsupported currency: {currency}", nameof(currency));

        return currency;
    }

    private static string ValidateTimeZone(string timeZone)
    {
        if (string.IsNullOrWhiteSpace(timeZone))
            throw new ArgumentException("TimeZone cannot be empty", nameof(timeZone));

        try
        {
            TimeZoneInfo.FindSystemTimeZoneById(timeZone);
            return timeZone;
        }
        catch (TimeZoneNotFoundException)
        {
            // Fallback to common timezone mappings
            var commonTimeZones = new Dictionary<string, string>
            {
                { "UTC", "UTC" },
                { "Bangkok", "SE Asia Standard Time" },
                { "Tokyo", "Tokyo Standard Time" },
                { "Seoul", "Korea Standard Time" },
                { "Singapore", "Singapore Standard Time" },
                { "New York", "Eastern Standard Time" },
                { "Los Angeles", "Pacific Standard Time" },
                { "London", "GMT Standard Time" }
            };

            if (commonTimeZones.TryGetValue(timeZone, out var mappedTimeZone))
                return mappedTimeZone;

            throw new ArgumentException($"Invalid timezone: {timeZone}", nameof(timeZone));
        }
    }

    public bool Equals(UserPreferences? other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true;
        
        return Language == other.Language &&
               Currency == other.Currency &&
               TimeZone == other.TimeZone &&
               NotificationSettings.Equals(other.NotificationSettings) &&
               PrivacySettings.Equals(other.PrivacySettings) &&
               CustomSettings.SequenceEqual(other.CustomSettings);
    }

    public override bool Equals(object? obj)
    {
        return Equals(obj as UserPreferences);
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Language, Currency, TimeZone, NotificationSettings, PrivacySettings);
    }

    public static bool operator ==(UserPreferences? left, UserPreferences? right)
    {
        return Equals(left, right);
    }

    public static bool operator !=(UserPreferences? left, UserPreferences? right)
    {
        return !Equals(left, right);
    }
}

public class NotificationSettings : IEquatable<NotificationSettings>
{
    public bool EmailNotifications { get; private set; }
    public bool SmsNotifications { get; private set; }
    public bool PushNotifications { get; private set; }
    public bool MarketingEmails { get; private set; }
    public bool OrderUpdates { get; private set; }
    public bool SecurityAlerts { get; private set; }
    public bool NewsletterSubscription { get; private set; }

    public NotificationSettings(
        bool emailNotifications = true,
        bool smsNotifications = false,
        bool pushNotifications = true,
        bool marketingEmails = false,
        bool orderUpdates = true,
        bool securityAlerts = true,
        bool newsletterSubscription = false)
    {
        EmailNotifications = emailNotifications;
        SmsNotifications = smsNotifications;
        PushNotifications = pushNotifications;
        MarketingEmails = marketingEmails;
        OrderUpdates = orderUpdates;
        SecurityAlerts = securityAlerts;
        NewsletterSubscription = newsletterSubscription;
    }

    public void UpdateEmailNotifications(bool enabled) => EmailNotifications = enabled;
    public void UpdateSmsNotifications(bool enabled) => SmsNotifications = enabled;
    public void UpdatePushNotifications(bool enabled) => PushNotifications = enabled;
    public void UpdateMarketingEmails(bool enabled) => MarketingEmails = enabled;
    public void UpdateOrderUpdates(bool enabled) => OrderUpdates = enabled;
    public void UpdateSecurityAlerts(bool enabled) => SecurityAlerts = enabled;
    public void UpdateNewsletterSubscription(bool enabled) => NewsletterSubscription = enabled;

    public bool Equals(NotificationSettings? other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true;
        
        return EmailNotifications == other.EmailNotifications &&
               SmsNotifications == other.SmsNotifications &&
               PushNotifications == other.PushNotifications &&
               MarketingEmails == other.MarketingEmails &&
               OrderUpdates == other.OrderUpdates &&
               SecurityAlerts == other.SecurityAlerts &&
               NewsletterSubscription == other.NewsletterSubscription;
    }

    public override bool Equals(object? obj) => Equals(obj as NotificationSettings);
    public override int GetHashCode() => HashCode.Combine(EmailNotifications, SmsNotifications, PushNotifications, MarketingEmails, OrderUpdates, SecurityAlerts, NewsletterSubscription);
}

public class PrivacySettings : IEquatable<PrivacySettings>
{
    public bool ProfileVisibility { get; private set; }
    public bool ShowOnlineStatus { get; private set; }
    public bool AllowDataCollection { get; private set; }
    public bool AllowPersonalization { get; private set; }
    public bool AllowThirdPartySharing { get; private set; }

    public PrivacySettings(
        bool profileVisibility = true,
        bool showOnlineStatus = false,
        bool allowDataCollection = true,
        bool allowPersonalization = true,
        bool allowThirdPartySharing = false)
    {
        ProfileVisibility = profileVisibility;
        ShowOnlineStatus = showOnlineStatus;
        AllowDataCollection = allowDataCollection;
        AllowPersonalization = allowPersonalization;
        AllowThirdPartySharing = allowThirdPartySharing;
    }

    public void UpdateProfileVisibility(bool visible) => ProfileVisibility = visible;
    public void UpdateShowOnlineStatus(bool show) => ShowOnlineStatus = show;
    public void UpdateAllowDataCollection(bool allow) => AllowDataCollection = allow;
    public void UpdateAllowPersonalization(bool allow) => AllowPersonalization = allow;
    public void UpdateAllowThirdPartySharing(bool allow) => AllowThirdPartySharing = allow;

    public bool Equals(PrivacySettings? other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true;
        
        return ProfileVisibility == other.ProfileVisibility &&
               ShowOnlineStatus == other.ShowOnlineStatus &&
               AllowDataCollection == other.AllowDataCollection &&
               AllowPersonalization == other.AllowPersonalization &&
               AllowThirdPartySharing == other.AllowThirdPartySharing;
    }

    public override bool Equals(object? obj) => Equals(obj as PrivacySettings);
    public override int GetHashCode() => HashCode.Combine(ProfileVisibility, ShowOnlineStatus, AllowDataCollection, AllowPersonalization, AllowThirdPartySharing);
}
