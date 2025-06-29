using UserService.Domain.Common;
using UserService.Domain.ValueObjects;

namespace UserService.Domain.Entities;

public class User : BaseAuditableEntity
{
    public Guid Id { get; private set; }
    public Email Email { get; private set; }
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public PhoneNumber? PhoneNumber { get; private set; }
    public DateTime? DateOfBirth { get; private set; }
    public Gender? Gender { get; private set; }
    public UserStatus Status { get; private set; }
    public DateTime? EmailVerifiedAt { get; private set; }
    public DateTime? PhoneVerifiedAt { get; private set; }
    public string? ProfileImageUrl { get; private set; }
    public UserPreferences Preferences { get; private set; }
    
    // Navigation properties
    public ICollection<UserAddress> Addresses { get; private set; } = new List<UserAddress>();
    public ICollection<UserRole> UserRoles { get; private set; } = new List<UserRole>();
    public ICollection<UserSession> Sessions { get; private set; } = new List<UserSession>();

    private User() { } // EF Core constructor

    public User(
        Email email,
        string firstName,
        string lastName,
        PhoneNumber? phoneNumber = null,
        DateTime? dateOfBirth = null,
        Gender? gender = null)
    {
        Id = Guid.NewGuid();
        Email = email ?? throw new ArgumentNullException(nameof(email));
        FirstName = firstName ?? throw new ArgumentNullException(nameof(firstName));
        LastName = lastName ?? throw new ArgumentNullException(nameof(lastName));
        PhoneNumber = phoneNumber;
        DateOfBirth = dateOfBirth;
        Gender = gender;
        Status = UserStatus.Active;
        Preferences = new UserPreferences();
        
        ValidateUser();
    }

    public void UpdateProfile(
        string firstName,
        string lastName,
        PhoneNumber? phoneNumber = null,
        DateTime? dateOfBirth = null,
        Gender? gender = null)
    {
        FirstName = firstName ?? throw new ArgumentNullException(nameof(firstName));
        LastName = lastName ?? throw new ArgumentNullException(nameof(lastName));
        PhoneNumber = phoneNumber;
        DateOfBirth = dateOfBirth;
        Gender = gender;
        
        ValidateUser();
        UpdateModifiedDate();
    }

    public void VerifyEmail()
    {
        EmailVerifiedAt = DateTime.UtcNow;
        UpdateModifiedDate();
    }

    public void VerifyPhone()
    {
        PhoneVerifiedAt = DateTime.UtcNow;
        UpdateModifiedDate();
    }

    public void UpdateProfileImage(string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
            throw new ArgumentException("Profile image URL cannot be empty", nameof(imageUrl));
            
        ProfileImageUrl = imageUrl;
        UpdateModifiedDate();
    }

    public void ChangeStatus(UserStatus status)
    {
        Status = status;
        UpdateModifiedDate();
    }

    public void AddAddress(UserAddress address)
    {
        if (address == null)
            throw new ArgumentNullException(nameof(address));
            
        Addresses.Add(address);
        UpdateModifiedDate();
    }

    public void RemoveAddress(Guid addressId)
    {
        var address = Addresses.FirstOrDefault(a => a.Id == addressId);
        if (address != null)
        {
            Addresses.Remove(address);
            UpdateModifiedDate();
        }
    }

    public void AssignRole(Role role)
    {
        if (role == null)
            throw new ArgumentNullException(nameof(role));
            
        if (!UserRoles.Any(ur => ur.RoleId == role.Id))
        {
            UserRoles.Add(new UserRole(Id, role.Id));
            UpdateModifiedDate();
        }
    }

    public void RemoveRole(Guid roleId)
    {
        var userRole = UserRoles.FirstOrDefault(ur => ur.RoleId == roleId);
        if (userRole != null)
        {
            UserRoles.Remove(userRole);
            UpdateModifiedDate();
        }
    }

    public bool HasRole(string roleName)
    {
        return UserRoles.Any(ur => ur.Role.Name.Equals(roleName, StringComparison.OrdinalIgnoreCase));
    }

    public bool IsEmailVerified => EmailVerifiedAt.HasValue;
    public bool IsPhoneVerified => PhoneVerifiedAt.HasValue;
    public bool IsActive => Status == UserStatus.Active;
    public string FullName => $"{FirstName} {LastName}";
    public int Age => DateOfBirth.HasValue ? 
        DateTime.Today.Year - DateOfBirth.Value.Year - 
        (DateTime.Today.DayOfYear < DateOfBirth.Value.DayOfYear ? 1 : 0) : 0;

    private void ValidateUser()
    {
        if (string.IsNullOrWhiteSpace(FirstName))
            throw new ArgumentException("First name is required", nameof(FirstName));
            
        if (string.IsNullOrWhiteSpace(LastName))
            throw new ArgumentException("Last name is required", nameof(LastName));
            
        if (DateOfBirth.HasValue && DateOfBirth.Value > DateTime.Today)
            throw new ArgumentException("Date of birth cannot be in the future", nameof(DateOfBirth));
            
        if (DateOfBirth.HasValue && DateTime.Today.Year - DateOfBirth.Value.Year > 120)
            throw new ArgumentException("Invalid date of birth", nameof(DateOfBirth));
    }
}

public enum UserStatus
{
    Active = 1,
    Inactive = 2,
    Suspended = 3,
    Deleted = 4
}

public enum Gender
{
    Male = 1,
    Female = 2,
    Other = 3,
    PreferNotToSay = 4
}
