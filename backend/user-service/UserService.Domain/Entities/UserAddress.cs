using UserService.Domain.Common;
using UserService.Domain.ValueObjects;

namespace UserService.Domain.Entities;

public class UserAddress : BaseAuditableEntity
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Label { get; private set; } // Home, Work, Other
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public PhoneNumber? PhoneNumber { get; private set; }
    public string AddressLine1 { get; private set; }
    public string? AddressLine2 { get; private set; }
    public string City { get; private set; }
    public string State { get; private set; }
    public string PostalCode { get; private set; }
    public string Country { get; private set; }
    public bool IsDefault { get; private set; }
    public AddressType Type { get; private set; }
    public double? Latitude { get; private set; }
    public double? Longitude { get; private set; }
    public string? DeliveryInstructions { get; private set; }

    // Navigation properties
    public User User { get; private set; } = null!;

    private UserAddress() { } // EF Core constructor

    public UserAddress(
        Guid userId,
        string label,
        string firstName,
        string lastName,
        string addressLine1,
        string city,
        string state,
        string postalCode,
        string country,
        AddressType type = AddressType.Shipping,
        string? addressLine2 = null,
        PhoneNumber? phoneNumber = null,
        bool isDefault = false,
        string? deliveryInstructions = null)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        Label = label ?? throw new ArgumentNullException(nameof(label));
        FirstName = firstName ?? throw new ArgumentNullException(nameof(firstName));
        LastName = lastName ?? throw new ArgumentNullException(nameof(lastName));
        AddressLine1 = addressLine1 ?? throw new ArgumentNullException(nameof(addressLine1));
        AddressLine2 = addressLine2;
        City = city ?? throw new ArgumentNullException(nameof(city));
        State = state ?? throw new ArgumentNullException(nameof(state));
        PostalCode = postalCode ?? throw new ArgumentNullException(nameof(postalCode));
        Country = country ?? throw new ArgumentNullException(nameof(country));
        PhoneNumber = phoneNumber;
        IsDefault = isDefault;
        Type = type;
        DeliveryInstructions = deliveryInstructions;

        ValidateAddress();
    }

    public void UpdateAddress(
        string label,
        string firstName,
        string lastName,
        string addressLine1,
        string city,
        string state,
        string postalCode,
        string country,
        string? addressLine2 = null,
        PhoneNumber? phoneNumber = null,
        string? deliveryInstructions = null)
    {
        Label = label ?? throw new ArgumentNullException(nameof(label));
        FirstName = firstName ?? throw new ArgumentNullException(nameof(firstName));
        LastName = lastName ?? throw new ArgumentNullException(nameof(lastName));
        AddressLine1 = addressLine1 ?? throw new ArgumentNullException(nameof(addressLine1));
        AddressLine2 = addressLine2;
        City = city ?? throw new ArgumentNullException(nameof(city));
        State = state ?? throw new ArgumentNullException(nameof(state));
        PostalCode = postalCode ?? throw new ArgumentNullException(nameof(postalCode));
        Country = country ?? throw new ArgumentNullException(nameof(country));
        PhoneNumber = phoneNumber;
        DeliveryInstructions = deliveryInstructions;

        ValidateAddress();
        UpdateModifiedDate();
    }

    public void SetAsDefault()
    {
        IsDefault = true;
        UpdateModifiedDate();
    }

    public void RemoveAsDefault()
    {
        IsDefault = false;
        UpdateModifiedDate();
    }

    public void UpdateCoordinates(double latitude, double longitude)
    {
        if (latitude < -90 || latitude > 90)
            throw new ArgumentException("Latitude must be between -90 and 90", nameof(latitude));

        if (longitude < -180 || longitude > 180)
            throw new ArgumentException("Longitude must be between -180 and 180", nameof(longitude));

        Latitude = latitude;
        Longitude = longitude;
        UpdateModifiedDate();
    }

    public void UpdateDeliveryInstructions(string? instructions)
    {
        DeliveryInstructions = instructions;
        UpdateModifiedDate();
    }

    public string GetFullAddress()
    {
        var parts = new List<string> { AddressLine1 };
        
        if (!string.IsNullOrWhiteSpace(AddressLine2))
            parts.Add(AddressLine2);
            
        parts.Add(City);
        parts.Add(State);
        parts.Add(PostalCode);
        parts.Add(Country);

        return string.Join(", ", parts);
    }

    public string GetFullName()
    {
        return $"{FirstName} {LastName}";
    }

    public bool IsInCountry(string countryCode)
    {
        return Country.Equals(countryCode, StringComparison.OrdinalIgnoreCase);
    }

    public bool HasCoordinates()
    {
        return Latitude.HasValue && Longitude.HasValue;
    }

    public double? CalculateDistanceFrom(double latitude, double longitude)
    {
        if (!HasCoordinates())
            return null;

        // Haversine formula for calculating distance between two points
        const double earthRadius = 6371; // Earth's radius in kilometers

        var lat1Rad = DegreesToRadians(Latitude!.Value);
        var lat2Rad = DegreesToRadians(latitude);
        var deltaLatRad = DegreesToRadians(latitude - Latitude.Value);
        var deltaLonRad = DegreesToRadians(longitude - Longitude!.Value);

        var a = Math.Sin(deltaLatRad / 2) * Math.Sin(deltaLatRad / 2) +
                Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
                Math.Sin(deltaLonRad / 2) * Math.Sin(deltaLonRad / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return earthRadius * c;
    }

    private static double DegreesToRadians(double degrees)
    {
        return degrees * Math.PI / 180;
    }

    private void ValidateAddress()
    {
        if (string.IsNullOrWhiteSpace(Label))
            throw new ArgumentException("Address label is required", nameof(Label));

        if (string.IsNullOrWhiteSpace(FirstName))
            throw new ArgumentException("First name is required", nameof(FirstName));

        if (string.IsNullOrWhiteSpace(LastName))
            throw new ArgumentException("Last name is required", nameof(LastName));

        if (string.IsNullOrWhiteSpace(AddressLine1))
            throw new ArgumentException("Address line 1 is required", nameof(AddressLine1));

        if (string.IsNullOrWhiteSpace(City))
            throw new ArgumentException("City is required", nameof(City));

        if (string.IsNullOrWhiteSpace(State))
            throw new ArgumentException("State is required", nameof(State));

        if (string.IsNullOrWhiteSpace(PostalCode))
            throw new ArgumentException("Postal code is required", nameof(PostalCode));

        if (string.IsNullOrWhiteSpace(Country))
            throw new ArgumentException("Country is required", nameof(Country));

        // Validate postal code format based on country
        ValidatePostalCodeForCountry(PostalCode, Country);
    }

    private static void ValidatePostalCodeForCountry(string postalCode, string country)
    {
        var patterns = new Dictionary<string, string>
        {
            { "TH", @"^\d{5}$" }, // Thailand: 5 digits
            { "US", @"^\d{5}(-\d{4})?$" }, // US: 5 digits or 5+4
            { "GB", @"^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$" }, // UK postcode
            { "CA", @"^[A-Z]\d[A-Z]\s?\d[A-Z]\d$" }, // Canada
            { "JP", @"^\d{3}-\d{4}$" }, // Japan
            { "KR", @"^\d{5}$" }, // South Korea
            { "SG", @"^\d{6}$" }, // Singapore
            { "MY", @"^\d{5}$" }, // Malaysia
        };

        if (patterns.TryGetValue(country.ToUpperInvariant(), out var pattern))
        {
            if (!System.Text.RegularExpressions.Regex.IsMatch(postalCode, pattern))
                throw new ArgumentException($"Invalid postal code format for {country}", nameof(postalCode));
        }
    }
}

public enum AddressType
{
    Shipping = 1,
    Billing = 2,
    Both = 3
}
