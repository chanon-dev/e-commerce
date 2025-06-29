using UserService.Domain.Common;
using UserService.Domain.ValueObjects;
using UserService.Domain.Events;

namespace UserService.Domain.Entities;

/// <summary>
/// User aggregate root following DDD principles
/// </summary>
public class User : AggregateRoot<Guid>
{
    private readonly List<Address> _addresses = new();
    private readonly List<WishlistItem> _wishlistItems = new();

    // Private constructor for EF Core
    private User() { }

    // Factory method for creating new users
    public static User Create(
        Email email,
        PersonName name,
        PhoneNumber? phoneNumber = null)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Name = name,
            PhoneNumber = phoneNumber,
            Status = UserStatus.PendingVerification,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Domain event
        user.AddDomainEvent(new UserCreatedEvent(user.Id, user.Email.Value, user.Name.FullName));

        return user;
    }

    // Properties
    public Email Email { get; private set; } = null!;
    public PersonName Name { get; private set; } = null!;
    public PhoneNumber? PhoneNumber { get; private set; }
    public string? Avatar { get; private set; }
    public UserStatus Status { get; private set; }
    public bool EmailVerified { get; private set; }
    public bool PhoneVerified { get; private set; }
    public DateTime? LastLoginAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation properties
    public IReadOnlyCollection<Address> Addresses => _addresses.AsReadOnly();
    public IReadOnlyCollection<WishlistItem> WishlistItems => _wishlistItems.AsReadOnly();

    // Business methods
    public void UpdateProfile(PersonName name, PhoneNumber? phoneNumber = null)
    {
        Name = name;
        PhoneNumber = phoneNumber;
        UpdatedAt = DateTime.UtcNow;

        AddDomainEvent(new UserProfileUpdatedEvent(Id, Name.FullName));
    }

    public void VerifyEmail()
    {
        if (EmailVerified)
            throw new InvalidOperationException("Email is already verified");

        EmailVerified = true;
        Status = UserStatus.Active;
        UpdatedAt = DateTime.UtcNow;

        AddDomainEvent(new UserEmailVerifiedEvent(Id, Email.Value));
    }

    public void VerifyPhone()
    {
        if (PhoneNumber == null)
            throw new InvalidOperationException("Phone number is not set");

        if (PhoneVerified)
            throw new InvalidOperationException("Phone is already verified");

        PhoneVerified = true;
        UpdatedAt = DateTime.UtcNow;

        AddDomainEvent(new UserPhoneVerifiedEvent(Id, PhoneNumber.Value));
    }

    public void UpdateLastLogin()
    {
        LastLoginAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;

        AddDomainEvent(new UserLoggedInEvent(Id, LastLoginAt.Value));
    }

    public void SuspendAccount(string reason)
    {
        Status = UserStatus.Suspended;
        UpdatedAt = DateTime.UtcNow;

        AddDomainEvent(new UserSuspendedEvent(Id, reason));
    }

    public void ActivateAccount()
    {
        if (Status == UserStatus.Suspended)
        {
            Status = UserStatus.Active;
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new UserActivatedEvent(Id));
        }
    }

    public void AddAddress(Address address)
    {
        if (_addresses.Any(a => a.IsDefault) && address.IsDefault)
        {
            // Remove default from existing addresses
            foreach (var existingAddress in _addresses.Where(a => a.IsDefault))
            {
                existingAddress.SetAsNonDefault();
            }
        }

        _addresses.Add(address);
        UpdatedAt = DateTime.UtcNow;

        AddDomainEvent(new UserAddressAddedEvent(Id, address.Id));
    }

    public void RemoveAddress(Guid addressId)
    {
        var address = _addresses.FirstOrDefault(a => a.Id == addressId);
        if (address != null)
        {
            _addresses.Remove(address);
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new UserAddressRemovedEvent(Id, addressId));
        }
    }

    public void AddToWishlist(Guid productId)
    {
        if (_wishlistItems.Any(w => w.ProductId == productId))
            return; // Already in wishlist

        var wishlistItem = WishlistItem.Create(Id, productId);
        _wishlistItems.Add(wishlistItem);
        UpdatedAt = DateTime.UtcNow;

        AddDomainEvent(new ProductAddedToWishlistEvent(Id, productId));
    }

    public void RemoveFromWishlist(Guid productId)
    {
        var item = _wishlistItems.FirstOrDefault(w => w.ProductId == productId);
        if (item != null)
        {
            _wishlistItems.Remove(item);
            UpdatedAt = DateTime.UtcNow;

            AddDomainEvent(new ProductRemovedFromWishlistEvent(Id, productId));
        }
    }

    public void UpdateAvatar(string avatarUrl)
    {
        Avatar = avatarUrl;
        UpdatedAt = DateTime.UtcNow;

        AddDomainEvent(new UserAvatarUpdatedEvent(Id, avatarUrl));
    }

    // Business rules validation
    public bool CanAddAddress()
    {
        return _addresses.Count < 10; // Business rule: max 10 addresses
    }

    public bool CanAddToWishlist()
    {
        return _wishlistItems.Count < 100; // Business rule: max 100 wishlist items
    }

    public bool IsActive()
    {
        return Status == UserStatus.Active && EmailVerified;
    }
}

public enum UserStatus
{
    PendingVerification = 1,
    Active = 2,
    Inactive = 3,
    Suspended = 4,
    Deleted = 5
}
