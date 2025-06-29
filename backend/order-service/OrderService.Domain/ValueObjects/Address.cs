namespace OrderService.Domain.ValueObjects;

public class Address : IEquatable<Address>
{
    public string Street { get; }
    public string? Street2 { get; }
    public string City { get; }
    public string State { get; }
    public string PostalCode { get; }
    public string Country { get; }
    public string? Company { get; }
    public string? Instructions { get; }

    public Address(
        string street,
        string city,
        string state,
        string postalCode,
        string country,
        string? street2 = null,
        string? company = null,
        string? instructions = null)
    {
        if (string.IsNullOrWhiteSpace(street))
            throw new ArgumentException("Street is required", nameof(street));
            
        if (string.IsNullOrWhiteSpace(city))
            throw new ArgumentException("City is required", nameof(city));
            
        if (string.IsNullOrWhiteSpace(state))
            throw new ArgumentException("State is required", nameof(state));
            
        if (string.IsNullOrWhiteSpace(postalCode))
            throw new ArgumentException("Postal code is required", nameof(postalCode));
            
        if (string.IsNullOrWhiteSpace(country))
            throw new ArgumentException("Country is required", nameof(country));

        Street = street.Trim();
        Street2 = string.IsNullOrWhiteSpace(street2) ? null : street2.Trim();
        City = city.Trim();
        State = state.Trim();
        PostalCode = postalCode.Trim();
        Country = country.Trim();
        Company = string.IsNullOrWhiteSpace(company) ? null : company.Trim();
        Instructions = string.IsNullOrWhiteSpace(instructions) ? null : instructions.Trim();
    }

    public string FullAddress => ToString();
    
    public string ShortAddress => $"{City}, {State} {PostalCode}";
    
    public bool HasCompany => !string.IsNullOrWhiteSpace(Company);
    
    public bool HasInstructions => !string.IsNullOrWhiteSpace(Instructions);
    
    public bool HasStreet2 => !string.IsNullOrWhiteSpace(Street2);

    public override string ToString()
    {
        var parts = new List<string>();
        
        if (HasCompany)
            parts.Add(Company!);
            
        parts.Add(Street);
        
        if (HasStreet2)
            parts.Add(Street2!);
            
        parts.Add($"{City}, {State} {PostalCode}");
        parts.Add(Country);
        
        return string.Join(Environment.NewLine, parts);
    }

    public string ToSingleLine()
    {
        var parts = new List<string>();
        
        if (HasCompany)
            parts.Add(Company!);
            
        parts.Add(Street);
        
        if (HasStreet2)
            parts.Add(Street2!);
            
        parts.Add($"{City}, {State} {PostalCode}, {Country}");
        
        return string.Join(", ", parts);
    }

    public bool Equals(Address? other)
    {
        if (other is null) return false;
        if (ReferenceEquals(this, other)) return true;
        
        return Street == other.Street &&
               Street2 == other.Street2 &&
               City == other.City &&
               State == other.State &&
               PostalCode == other.PostalCode &&
               Country == other.Country &&
               Company == other.Company;
    }

    public override bool Equals(object? obj)
    {
        return Equals(obj as Address);
    }

    public override int GetHashCode()
    {
        return HashCode.Combine(Street, Street2, City, State, PostalCode, Country, Company);
    }

    public static bool operator ==(Address? left, Address? right)
    {
        return Equals(left, right);
    }

    public static bool operator !=(Address? left, Address? right)
    {
        return !Equals(left, right);
    }
}
