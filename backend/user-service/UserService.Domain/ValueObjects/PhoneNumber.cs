using System.Text.RegularExpressions;

namespace UserService.Domain.ValueObjects;

public class PhoneNumber : IEquatable<PhoneNumber>
{
    private static readonly Regex PhoneRegex = new(
        @"^\+?[1-9]\d{1,14}$", // E.164 format
        RegexOptions.Compiled);

    private static readonly Dictionary<string, string> CountryCodeMap = new()
    {
        { "TH", "+66" }, // Thailand
        { "US", "+1" },  // United States
        { "GB", "+44" }, // United Kingdom
        { "JP", "+81" }, // Japan
        { "KR", "+82" }, // South Korea
        { "SG", "+65" }, // Singapore
        { "MY", "+60" }, // Malaysia
        { "ID", "+62" }, // Indonesia
        { "VN", "+84" }, // Vietnam
        { "PH", "+63" }  // Philippines
    };

    public string Value { get; private set; }
    public string CountryCode { get; private set; }
    public string NationalNumber { get; private set; }

    private PhoneNumber() { } // EF Core constructor

    public PhoneNumber(string value, string? countryCode = null)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Phone number cannot be empty", nameof(value));

        // Clean the input
        value = CleanPhoneNumber(value);

        // If no country code provided, try to detect or default to Thailand
        if (string.IsNullOrWhiteSpace(countryCode))
        {
            if (value.StartsWith("+"))
            {
                countryCode = DetectCountryCode(value);
            }
            else
            {
                countryCode = "TH"; // Default to Thailand
                value = ConvertToInternationalFormat(value, countryCode);
            }
        }
        else
        {
            value = ConvertToInternationalFormat(value, countryCode);
        }

        if (!PhoneRegex.IsMatch(value))
            throw new ArgumentException("Invalid phone number format", nameof(value));

        Value = value;
        CountryCode = countryCode.ToUpperInvariant();
        NationalNumber = ExtractNationalNumber(value);

        ValidatePhoneNumber();
    }

    private static string CleanPhoneNumber(string phoneNumber)
    {
        // Remove all non-digit characters except +
        return Regex.Replace(phoneNumber, @"[^\d+]", "");
    }

    private static string ConvertToInternationalFormat(string phoneNumber, string countryCode)
    {
        if (phoneNumber.StartsWith("+"))
            return phoneNumber;

        if (!CountryCodeMap.TryGetValue(countryCode.ToUpperInvariant(), out var prefix))
            throw new ArgumentException($"Unsupported country code: {countryCode}");

        // Handle Thai numbers specifically
        if (countryCode.ToUpperInvariant() == "TH")
        {
            if (phoneNumber.StartsWith("0"))
                phoneNumber = phoneNumber[1..]; // Remove leading 0
        }

        return $"{prefix}{phoneNumber}";
    }

    private static string DetectCountryCode(string phoneNumber)
    {
        foreach (var kvp in CountryCodeMap)
        {
            if (phoneNumber.StartsWith(kvp.Value))
                return kvp.Key;
        }
        return "TH"; // Default fallback
    }

    private static string ExtractNationalNumber(string internationalNumber)
    {
        foreach (var prefix in CountryCodeMap.Values)
        {
            if (internationalNumber.StartsWith(prefix))
                return internationalNumber[prefix.Length..];
        }
        return internationalNumber;
    }

    private void ValidatePhoneNumber()
    {
        // Additional validation based on country
        switch (CountryCode)
        {
            case "TH":
                ValidateThaiPhoneNumber();
                break;
            case "US":
                ValidateUSPhoneNumber();
                break;
            // Add more country-specific validations as needed
        }
    }

    private void ValidateThaiPhoneNumber()
    {
        // Thai mobile numbers: 08x, 09x, 06x
        // Thai landline: 02, 03x, 04x, 05x, 07x
        if (NationalNumber.Length < 8 || NationalNumber.Length > 9)
            throw new ArgumentException("Invalid Thai phone number length");

        var firstDigit = NationalNumber[0];
        if (NationalNumber.Length == 9 && !"0689".Contains(firstDigit))
            throw new ArgumentException("Invalid Thai mobile number format");
    }

    private void ValidateUSPhoneNumber()
    {
        if (NationalNumber.Length != 10)
            throw new ArgumentException("US phone numbers must be 10 digits");
    }

    public static implicit operator string(PhoneNumber phoneNumber) => phoneNumber.Value;
    public static implicit operator PhoneNumber(string phoneNumber) => new(phoneNumber);

    public bool Equals(PhoneNumber? other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true;
        return Value == other.Value;
    }

    public override bool Equals(object? obj)
    {
        return Equals(obj as PhoneNumber);
    }

    public override int GetHashCode()
    {
        return Value.GetHashCode();
    }

    public override string ToString() => Value;

    public static bool operator ==(PhoneNumber? left, PhoneNumber? right)
    {
        return Equals(left, right);
    }

    public static bool operator !=(PhoneNumber? left, PhoneNumber? right)
    {
        return !Equals(left, right);
    }

    public string GetFormattedNumber()
    {
        return CountryCode switch
        {
            "TH" => FormatThaiNumber(),
            "US" => FormatUSNumber(),
            _ => Value
        };
    }

    private string FormatThaiNumber()
    {
        if (NationalNumber.Length == 9) // Mobile
        {
            return $"{NationalNumber[..3]}-{NationalNumber[3..6]}-{NationalNumber[6..]}";
        }
        else if (NationalNumber.Length == 8) // Landline
        {
            return $"{NationalNumber[..2]}-{NationalNumber[2..5]}-{NationalNumber[5..]}";
        }
        return NationalNumber;
    }

    private string FormatUSNumber()
    {
        return $"({NationalNumber[..3]}) {NationalNumber[3..6]}-{NationalNumber[6..]}";
    }

    public bool IsMobile()
    {
        return CountryCode switch
        {
            "TH" => NationalNumber.Length == 9 && "0689".Contains(NationalNumber[0]),
            "US" => true, // US doesn't distinguish mobile/landline by number
            _ => false
        };
    }
}
