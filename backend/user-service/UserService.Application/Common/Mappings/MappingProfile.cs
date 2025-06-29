using AutoMapper;
using UserService.Application.Users.Common;
using UserService.Domain.Entities;

namespace UserService.Application.Common.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email.Value))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber != null ? src.PhoneNumber.Value : null))
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName))
            .ForMember(dest => dest.Age, opt => opt.MapFrom(src => src.Age))
            .ForMember(dest => dest.IsEmailVerified, opt => opt.MapFrom(src => src.IsEmailVerified))
            .ForMember(dest => dest.IsPhoneVerified, opt => opt.MapFrom(src => src.IsPhoneVerified))
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => src.IsActive))
            .ForMember(dest => dest.Preferences, opt => opt.MapFrom(src => src.Preferences))
            .ForMember(dest => dest.Addresses, opt => opt.MapFrom(src => src.Addresses))
            .ForMember(dest => dest.Roles, opt => opt.MapFrom(src => src.UserRoles))
            .ForMember(dest => dest.Sessions, opt => opt.MapFrom(src => src.Sessions.Where(s => s.IsActive)));

        CreateMap<User, UserSummaryDto>()
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email.Value))
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName))
            .ForMember(dest => dest.IsEmailVerified, opt => opt.MapFrom(src => src.IsEmailVerified))
            .ForMember(dest => dest.IsPhoneVerified, opt => opt.MapFrom(src => src.IsPhoneVerified))
            .ForMember(dest => dest.Roles, opt => opt.MapFrom(src => src.UserRoles.Select(ur => ur.Role.Name)));

        CreateMap<UserAddress, UserAddressDto>()
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber != null ? src.PhoneNumber.Value : null))
            .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.GetFullName()))
            .ForMember(dest => dest.FullAddress, opt => opt.MapFrom(src => src.GetFullAddress()))
            .ForMember(dest => dest.HasCoordinates, opt => opt.MapFrom(src => src.HasCoordinates()));

        CreateMap<UserRole, UserRoleDto>()
            .ForMember(dest => dest.RoleId, opt => opt.MapFrom(src => src.RoleId))
            .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role.Name))
            .ForMember(dest => dest.RoleDescription, opt => opt.MapFrom(src => src.Role.Description))
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Role.Priority))
            .ForMember(dest => dest.AssignedAt, opt => opt.MapFrom(src => src.AssignedAt))
            .ForMember(dest => dest.AssignedBy, opt => opt.MapFrom(src => src.AssignedBy))
            .ForMember(dest => dest.Permissions, opt => opt.MapFrom(src => src.Role.RolePermissions.Select(rp => rp.Permission)));

        CreateMap<Permission, PermissionDto>();

        CreateMap<UserSession, UserSessionDto>()
            .ForMember(dest => dest.IsExpired, opt => opt.MapFrom(src => src.IsExpired()))
            .ForMember(dest => dest.RemainingTime, opt => opt.MapFrom(src => src.GetRemainingTime()))
            .ForMember(dest => dest.SessionDuration, opt => opt.MapFrom(src => src.GetSessionDuration()));

        CreateMap<Domain.ValueObjects.UserPreferences, UserPreferencesDto>()
            .ForMember(dest => dest.NotificationSettings, opt => opt.MapFrom(src => src.NotificationSettings))
            .ForMember(dest => dest.PrivacySettings, opt => opt.MapFrom(src => src.PrivacySettings))
            .ForMember(dest => dest.CustomSettings, opt => opt.MapFrom(src => src.CustomSettings));

        CreateMap<Domain.ValueObjects.NotificationSettings, NotificationSettingsDto>();
        CreateMap<Domain.ValueObjects.PrivacySettings, PrivacySettingsDto>();

        // Reverse mappings for create/update operations
        CreateMap<CreateUserAddressDto, UserAddress>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => 
                !string.IsNullOrWhiteSpace(src.PhoneNumber) ? new Domain.ValueObjects.PhoneNumber(src.PhoneNumber) : null))
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ModifiedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.ModifiedBy, opt => opt.Ignore())
            .ForMember(dest => dest.Latitude, opt => opt.Ignore())
            .ForMember(dest => dest.Longitude, opt => opt.Ignore());

        CreateMap<UpdateUserAddressDto, UserAddress>()
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => 
                !string.IsNullOrWhiteSpace(src.PhoneNumber) ? new Domain.ValueObjects.PhoneNumber(src.PhoneNumber) : null))
            .ForMember(dest => dest.User, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ModifiedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.ModifiedBy, opt => opt.Ignore())
            .ForMember(dest => dest.Latitude, opt => opt.Ignore())
            .ForMember(dest => dest.Longitude, opt => opt.Ignore());

        // Role and Permission mappings
        CreateMap<Role, RoleDto>()
            .ForMember(dest => dest.Permissions, opt => opt.MapFrom(src => src.RolePermissions.Select(rp => rp.Permission)));

        CreateMap<Role, RoleSummaryDto>();
    }
}

// Additional DTOs for Role management
public class RoleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsSystemRole { get; set; }
    public int Priority { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public List<PermissionDto> Permissions { get; set; } = new();
}

public class RoleSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsSystemRole { get; set; }
    public int Priority { get; set; }
}
