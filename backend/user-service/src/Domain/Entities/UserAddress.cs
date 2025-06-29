using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UserService.Domain.Entities;

[Table("user_addresses")]
public class UserAddress : BaseEntity
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [Column("type")]
    [MaxLength(20)]
    public AddressType Type { get; set; }

    [Required]
    [Column("first_name")]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [Column("last_name")]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Column("company")]
    [MaxLength(100)]
    public string? Company { get; set; }

    [Required]
    [Column("address_line_1")]
    [MaxLength(255)]
    public string AddressLine1 { get; set; } = string.Empty;

    [Column("address_line_2")]
    [MaxLength(255)]
    public string? AddressLine2 { get; set; }

    [Required]
    [Column("city")]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [Required]
    [Column("state")]
    [MaxLength(100)]
    public string State { get; set; } = string.Empty;

    [Required]
    [Column("postal_code")]
    [MaxLength(20)]
    public string PostalCode { get; set; } = string.Empty;

    [Required]
    [Column("country")]
    [MaxLength(2)]
    public string Country { get; set; } = string.Empty;

    [Column("phone")]
    [MaxLength(20)]
    public string? Phone { get; set; }

    [Column("is_default")]
    public bool IsDefault { get; set; } = false;

    [Column("latitude")]
    [Column(TypeName = "decimal(10,8)")]
    public decimal? Latitude { get; set; }

    [Column("longitude")]
    [Column(TypeName = "decimal(11,8)")]
    public decimal? Longitude { get; set; }

    [Column("delivery_instructions")]
    [MaxLength(500)]
    public string? DeliveryInstructions { get; set; }

    // Navigation Properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    // Computed Properties
    [NotMapped]
    public string FullName => $"{FirstName} {LastName}".Trim();

    [NotMapped]
    public string FormattedAddress => 
        $"{AddressLine1}" +
        (!string.IsNullOrEmpty(AddressLine2) ? $", {AddressLine2}" : "") +
        $", {City}, {State} {PostalCode}, {Country}";

    // Methods
    public void SetAsDefault()
    {
        IsDefault = true;
    }

    public void RemoveDefault()
    {
        IsDefault = false;
    }

    public bool IsValidForShipping()
    {
        return !string.IsNullOrEmpty(AddressLine1) &&
               !string.IsNullOrEmpty(City) &&
               !string.IsNullOrEmpty(State) &&
               !string.IsNullOrEmpty(PostalCode) &&
               !string.IsNullOrEmpty(Country);
    }
}

public enum AddressType
{
    Home,
    Work,
    Billing,
    Shipping,
    Other
}
