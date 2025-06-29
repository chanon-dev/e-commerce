using FluentValidation;

namespace UserService.Application.Users.Commands.CreateUser;

public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format")
            .MaximumLength(254).WithMessage("Email is too long");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(100).WithMessage("First name is too long")
            .Matches(@"^[a-zA-Z\s\u0E00-\u0E7F]+$").WithMessage("First name contains invalid characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(100).WithMessage("Last name is too long")
            .Matches(@"^[a-zA-Z\s\u0E00-\u0E7F]+$").WithMessage("Last name contains invalid characters");

        RuleFor(x => x.PhoneNumber)
            .Must(BeValidPhoneNumber).WithMessage("Invalid phone number format")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

        RuleFor(x => x.DateOfBirth)
            .Must(BeValidDateOfBirth).WithMessage("Invalid date of birth")
            .When(x => x.DateOfBirth.HasValue);

        RuleFor(x => x.Gender)
            .IsInEnum().WithMessage("Invalid gender value")
            .When(x => x.Gender.HasValue);

        RuleFor(x => x.ProfileImageUrl)
            .Must(BeValidUrl).WithMessage("Invalid profile image URL")
            .When(x => !string.IsNullOrWhiteSpace(x.ProfileImageUrl));

        RuleFor(x => x.Roles)
            .Must(HaveValidRoles).WithMessage("Invalid role names provided")
            .When(x => x.Roles.Any());

        RuleFor(x => x.Preferences)
            .SetValidator(new UserPreferencesValidator()!)
            .When(x => x.Preferences != null);
    }

    private static bool BeValidPhoneNumber(string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return true;

        try
        {
            var phone = new Domain.ValueObjects.PhoneNumber(phoneNumber);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static bool BeValidDateOfBirth(DateTime? dateOfBirth)
    {
        if (!dateOfBirth.HasValue)
            return true;

        var today = DateTime.Today;
        var age = today.Year - dateOfBirth.Value.Year;
        
        if (dateOfBirth.Value.Date > today.AddYears(-age))
            age--;

        return dateOfBirth.Value <= today && age <= 120;
    }

    private static bool BeValidUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return true;

        return Uri.TryCreate(url, UriKind.Absolute, out var result) &&
               (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps);
    }

    private static bool HaveValidRoles(List<string> roles)
    {
        if (!roles.Any())
            return true;

        var validRoles = new[] { "Customer", "Manager", "Support", "Administrator" };
        return roles.All(role => validRoles.Contains(role, StringComparer.OrdinalIgnoreCase));
    }
}

public class UserPreferencesValidator : AbstractValidator<UserPreferencesDto>
{
    public UserPreferencesValidator()
    {
        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Language is required")
            .Must(BeValidLanguage).WithMessage("Invalid language code");

        RuleFor(x => x.Currency)
            .NotEmpty().WithMessage("Currency is required")
            .Must(BeValidCurrency).WithMessage("Invalid currency code");

        RuleFor(x => x.TimeZone)
            .NotEmpty().WithMessage("TimeZone is required")
            .Must(BeValidTimeZone).WithMessage("Invalid timezone");

        RuleFor(x => x.NotificationSettings)
            .NotNull().WithMessage("Notification settings are required")
            .SetValidator(new NotificationSettingsValidator());

        RuleFor(x => x.PrivacySettings)
            .NotNull().WithMessage("Privacy settings are required")
            .SetValidator(new PrivacySettingsValidator());
    }

    private static bool BeValidLanguage(string language)
    {
        var supportedLanguages = new[] { "en", "th", "ja", "ko", "zh", "es", "fr", "de" };
        return supportedLanguages.Contains(language.ToLowerInvariant());
    }

    private static bool BeValidCurrency(string currency)
    {
        var supportedCurrencies = new[] { "USD", "THB", "EUR", "GBP", "JPY", "KRW", "SGD", "MYR" };
        return supportedCurrencies.Contains(currency.ToUpperInvariant());
    }

    private static bool BeValidTimeZone(string timeZone)
    {
        try
        {
            TimeZoneInfo.FindSystemTimeZoneById(timeZone);
            return true;
        }
        catch
        {
            var commonTimeZones = new[] { "UTC", "Bangkok", "Tokyo", "Seoul", "Singapore" };
            return commonTimeZones.Contains(timeZone, StringComparer.OrdinalIgnoreCase);
        }
    }
}

public class NotificationSettingsValidator : AbstractValidator<NotificationSettingsDto>
{
    public NotificationSettingsValidator()
    {
        // All boolean properties are valid by default
        // Add custom rules if needed
    }
}

public class PrivacySettingsValidator : AbstractValidator<PrivacySettingsDto>
{
    public PrivacySettingsValidator()
    {
        // All boolean properties are valid by default
        // Add custom rules if needed
    }
}
