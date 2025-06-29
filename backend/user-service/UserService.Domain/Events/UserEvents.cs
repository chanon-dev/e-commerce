using UserService.Domain.Common;
using UserService.Domain.Entities;

namespace UserService.Domain.Events;

public class UserCreatedEvent : DomainEvent
{
    public Guid UserId { get; }
    public string Email { get; }
    public string FirstName { get; }
    public string LastName { get; }
    public DateTime CreatedAt { get; }

    public UserCreatedEvent(User user)
    {
        UserId = user.Id;
        Email = user.Email.Value;
        FirstName = user.FirstName;
        LastName = user.LastName;
        CreatedAt = user.CreatedAt;
    }
}

public class UserUpdatedEvent : DomainEvent
{
    public Guid UserId { get; }
    public string Email { get; }
    public string FirstName { get; }
    public string LastName { get; }
    public DateTime ModifiedAt { get; }

    public UserUpdatedEvent(User user)
    {
        UserId = user.Id;
        Email = user.Email.Value;
        FirstName = user.FirstName;
        LastName = user.LastName;
        ModifiedAt = user.ModifiedAt ?? DateTime.UtcNow;
    }
}

public class UserEmailVerifiedEvent : DomainEvent
{
    public Guid UserId { get; }
    public string Email { get; }
    public DateTime VerifiedAt { get; }

    public UserEmailVerifiedEvent(User user)
    {
        UserId = user.Id;
        Email = user.Email.Value;
        VerifiedAt = user.EmailVerifiedAt ?? DateTime.UtcNow;
    }
}

public class UserPhoneVerifiedEvent : DomainEvent
{
    public Guid UserId { get; }
    public string PhoneNumber { get; }
    public DateTime VerifiedAt { get; }

    public UserPhoneVerifiedEvent(User user)
    {
        UserId = user.Id;
        PhoneNumber = user.PhoneNumber?.Value ?? string.Empty;
        VerifiedAt = user.PhoneVerifiedAt ?? DateTime.UtcNow;
    }
}

public class UserStatusChangedEvent : DomainEvent
{
    public Guid UserId { get; }
    public UserStatus OldStatus { get; }
    public UserStatus NewStatus { get; }
    public DateTime ChangedAt { get; }

    public UserStatusChangedEvent(Guid userId, UserStatus oldStatus, UserStatus newStatus)
    {
        UserId = userId;
        OldStatus = oldStatus;
        NewStatus = newStatus;
        ChangedAt = DateTime.UtcNow;
    }
}

public class UserRoleAssignedEvent : DomainEvent
{
    public Guid UserId { get; }
    public Guid RoleId { get; }
    public string RoleName { get; }
    public DateTime AssignedAt { get; }

    public UserRoleAssignedEvent(Guid userId, Role role)
    {
        UserId = userId;
        RoleId = role.Id;
        RoleName = role.Name;
        AssignedAt = DateTime.UtcNow;
    }
}

public class UserRoleRemovedEvent : DomainEvent
{
    public Guid UserId { get; }
    public Guid RoleId { get; }
    public string RoleName { get; }
    public DateTime RemovedAt { get; }

    public UserRoleRemovedEvent(Guid userId, Role role)
    {
        UserId = userId;
        RoleId = role.Id;
        RoleName = role.Name;
        RemovedAt = DateTime.UtcNow;
    }
}

public class UserAddressAddedEvent : DomainEvent
{
    public Guid UserId { get; }
    public Guid AddressId { get; }
    public string AddressLabel { get; }
    public bool IsDefault { get; }
    public DateTime AddedAt { get; }

    public UserAddressAddedEvent(UserAddress address)
    {
        UserId = address.UserId;
        AddressId = address.Id;
        AddressLabel = address.Label;
        IsDefault = address.IsDefault;
        AddedAt = address.CreatedAt;
    }
}

public class UserSessionCreatedEvent : DomainEvent
{
    public Guid UserId { get; }
    public Guid SessionId { get; }
    public SessionType SessionType { get; }
    public string DeviceInfo { get; }
    public string IpAddress { get; }
    public DateTime CreatedAt { get; }

    public UserSessionCreatedEvent(UserSession session)
    {
        UserId = session.UserId;
        SessionId = session.Id;
        SessionType = session.Type;
        DeviceInfo = session.DeviceInfo;
        IpAddress = session.IpAddress;
        CreatedAt = session.CreatedAt;
    }
}

public class UserSessionTerminatedEvent : DomainEvent
{
    public Guid UserId { get; }
    public Guid SessionId { get; }
    public SessionType SessionType { get; }
    public TimeSpan SessionDuration { get; }
    public DateTime TerminatedAt { get; }

    public UserSessionTerminatedEvent(UserSession session)
    {
        UserId = session.UserId;
        SessionId = session.Id;
        SessionType = session.Type;
        SessionDuration = session.GetSessionDuration();
        TerminatedAt = DateTime.UtcNow;
    }
}
