using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UserService.Domain.Entities;

[Table("users")]
public class User : BaseEntity
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("email")]
    [MaxLength(255)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Column("password_hash")]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("first_name")]
    [MaxLength(100)]
    public string? FirstName { get; set; }

    [Column("last_name")]
    [MaxLength(100)]
    public string? LastName { get; set; }

    [Column("phone_number")]
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [Column("date_of_birth")]
    public DateTime? DateOfBirth { get; set; }

    [Column("gender")]
    [MaxLength(10)]
    public string? Gender { get; set; }

    [Column("is_email_verified")]
    public bool IsEmailVerified { get; set; } = false;

    [Column("is_phone_verified")]
    public bool IsPhoneVerified { get; set; } = false;

    [Column("email_verification_token")]
    [MaxLength(255)]
    public string? EmailVerificationToken { get; set; }

    [Column("phone_verification_token")]
    [MaxLength(10)]
    public string? PhoneVerificationToken { get; set; }

    [Column("password_reset_token")]
    [MaxLength(255)]
    public string? PasswordResetToken { get; set; }

    [Column("password_reset_expires")]
    public DateTime? PasswordResetExpires { get; set; }

    [Column("last_login_at")]
    public DateTime? LastLoginAt { get; set; }

    [Column("login_attempts")]
    public int LoginAttempts { get; set; } = 0;

    [Column("locked_until")]
    public DateTime? LockedUntil { get; set; }

    [Column("status")]
    [MaxLength(20)]
    public UserStatus Status { get; set; } = UserStatus.Active;

    [Column("avatar_url")]
    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    [Column("timezone")]
    [MaxLength(50)]
    public string? Timezone { get; set; }

    [Column("locale")]
    [MaxLength(10)]
    public string? Locale { get; set; } = "en-US";

    [Column("preferences")]
    [Column(TypeName = "jsonb")]
    public string? Preferences { get; set; }

    [Column("metadata")]
    [Column(TypeName = "jsonb")]
    public string? Metadata { get; set; }

    // Navigation Properties
    public virtual ICollection<UserAddress> Addresses { get; set; } = new List<UserAddress>();
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public virtual ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
    public virtual ICollection<UserPreference> UserPreferences { get; set; } = new List<UserPreference>();
    public virtual ICollection<SocialLogin> SocialLogins { get; set; } = new List<SocialLogin>();

    // Computed Properties
    [NotMapped]
    public string FullName => $"{FirstName} {LastName}".Trim();

    [NotMapped]
    public bool IsLocked => LockedUntil.HasValue && LockedUntil > DateTime.UtcNow;

    [NotMapped]
    public int Age => DateOfBirth.HasValue 
        ? DateTime.Today.Year - DateOfBirth.Value.Year - (DateTime.Today.DayOfYear < DateOfBirth.Value.DayOfYear ? 1 : 0)
        : 0;

    // Methods
    public void LockAccount(TimeSpan lockDuration)
    {
        LockedUntil = DateTime.UtcNow.Add(lockDuration);
        LoginAttempts = 0;
    }

    public void UnlockAccount()
    {
        LockedUntil = null;
        LoginAttempts = 0;
    }

    public void IncrementLoginAttempts()
    {
        LoginAttempts++;
        if (LoginAttempts >= 5)
        {
            LockAccount(TimeSpan.FromMinutes(30));
        }
    }

    public void ResetLoginAttempts()
    {
        LoginAttempts = 0;
        LockedUntil = null;
    }

    public void UpdateLastLogin()
    {
        LastLoginAt = DateTime.UtcNow;
        ResetLoginAttempts();
    }
}

public enum UserStatus
{
    Active,
    Inactive,
    Suspended,
    Deleted,
    PendingVerification
}
