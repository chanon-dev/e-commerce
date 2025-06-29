using AutoMapper;
using MediatR;
using UserService.Application.Common.Interfaces;
using UserService.Application.Common.Models;
using UserService.Application.Users.Common;
using UserService.Domain.Entities;
using UserService.Domain.Events;
using UserService.Domain.ValueObjects;

namespace UserService.Application.Users.Commands.CreateUser;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, Result<UserDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IDomainEventService _domainEventService;
    private readonly IEmailService _emailService;
    private readonly ITokenService _tokenService;

    public CreateUserCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IDomainEventService domainEventService,
        IEmailService emailService,
        ITokenService tokenService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _domainEventService = domainEventService;
        _emailService = emailService;
        _tokenService = tokenService;
    }

    public async Task<Result<UserDto>> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Validate email uniqueness
            var email = new Email(request.Email);
            if (await _unitOfWork.Users.EmailExistsAsync(email, cancellationToken))
            {
                return Result<UserDto>.Failure("Email already exists");
            }

            // Validate phone number uniqueness if provided
            PhoneNumber? phoneNumber = null;
            if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                phoneNumber = new PhoneNumber(request.PhoneNumber);
                if (await _unitOfWork.Users.PhoneNumberExistsAsync(phoneNumber, cancellationToken))
                {
                    return Result<UserDto>.Failure("Phone number already exists");
                }
            }

            // Create user preferences
            var preferences = CreateUserPreferences(request.Preferences);

            // Create user entity
            var user = new User(
                email,
                request.FirstName,
                request.LastName,
                phoneNumber,
                request.DateOfBirth,
                request.Gender);

            // Update preferences if provided
            if (request.Preferences != null)
            {
                user.GetType().GetProperty("Preferences")?.SetValue(user, preferences);
            }

            // Update profile image if provided
            if (!string.IsNullOrWhiteSpace(request.ProfileImageUrl))
            {
                user.UpdateProfileImage(request.ProfileImageUrl);
            }

            // Assign roles
            if (request.Roles.Any())
            {
                await AssignRolesToUser(user, request.Roles, cancellationToken);
            }
            else
            {
                // Assign default customer role
                var customerRole = await _unitOfWork.Roles.GetByNameAsync("Customer", cancellationToken);
                if (customerRole != null)
                {
                    user.AssignRole(customerRole);
                }
            }

            // Add user to repository
            await _unitOfWork.Users.AddAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Publish domain events
            user.AddDomainEvent(new UserCreatedEvent(user));
            await _domainEventService.PublishAsync(user.DomainEvents, cancellationToken);

            // Send welcome email
            await SendWelcomeEmailAsync(user, cancellationToken);

            // Map to DTO
            var userDto = _mapper.Map<UserDto>(user);

            return Result<UserDto>.Success(userDto);
        }
        catch (ArgumentException ex)
        {
            return Result<UserDto>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<UserDto>.Failure($"Failed to create user: {ex.Message}");
        }
    }

    private static UserPreferences CreateUserPreferences(UserPreferencesDto? preferencesDto)
    {
        if (preferencesDto == null)
            return new UserPreferences();

        var notificationSettings = new NotificationSettings(
            preferencesDto.NotificationSettings.EmailNotifications,
            preferencesDto.NotificationSettings.SmsNotifications,
            preferencesDto.NotificationSettings.PushNotifications,
            preferencesDto.NotificationSettings.MarketingEmails,
            preferencesDto.NotificationSettings.OrderUpdates,
            preferencesDto.NotificationSettings.SecurityAlerts,
            preferencesDto.NotificationSettings.NewsletterSubscription);

        var privacySettings = new PrivacySettings(
            preferencesDto.PrivacySettings.ProfileVisibility,
            preferencesDto.PrivacySettings.ShowOnlineStatus,
            preferencesDto.PrivacySettings.AllowDataCollection,
            preferencesDto.PrivacySettings.AllowPersonalization,
            preferencesDto.PrivacySettings.AllowThirdPartySharing);

        return new UserPreferences(
            preferencesDto.Language,
            preferencesDto.Currency,
            preferencesDto.TimeZone,
            notificationSettings,
            privacySettings,
            preferencesDto.CustomSettings);
    }

    private async Task AssignRolesToUser(User user, List<string> roleNames, CancellationToken cancellationToken)
    {
        foreach (var roleName in roleNames)
        {
            var role = await _unitOfWork.Roles.GetByNameAsync(roleName, cancellationToken);
            if (role != null && role.IsActive)
            {
                user.AssignRole(role);
            }
        }
    }

    private async Task SendWelcomeEmailAsync(User user, CancellationToken cancellationToken)
    {
        try
        {
            await _emailService.SendWelcomeEmailAsync(
                user.Email.Value,
                user.FirstName,
                cancellationToken);
        }
        catch (Exception)
        {
            // Log error but don't fail the user creation
            // In production, you might want to queue this for retry
        }
    }
}
