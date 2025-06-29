using AutoMapper;
using MediatR;
using UserService.Application.Common.Interfaces;
using UserService.Application.Common.Models;
using UserService.Application.Users.Common;
using UserService.Domain.Events;
using UserService.Domain.ValueObjects;

namespace UserService.Application.Users.Commands.UpdateUser;

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, Result<UserDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IDomainEventService _domainEventService;

    public UpdateUserCommandHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IDomainEventService domainEventService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _domainEventService = domainEventService;
    }

    public async Task<Result<UserDto>> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Get existing user
            var user = await _unitOfWork.Users.GetByIdAsync(request.Id, cancellationToken);
            if (user == null)
            {
                return Result<UserDto>.Failure("User not found");
            }

            // Validate phone number uniqueness if changed
            PhoneNumber? phoneNumber = null;
            if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
            {
                phoneNumber = new PhoneNumber(request.PhoneNumber);
                
                // Check if phone number is different and already exists
                if (user.PhoneNumber?.Value != phoneNumber.Value)
                {
                    if (await _unitOfWork.Users.PhoneNumberExistsAsync(phoneNumber, cancellationToken))
                    {
                        return Result<UserDto>.Failure("Phone number already exists");
                    }
                }
            }

            // Update user profile
            user.UpdateProfile(
                request.FirstName,
                request.LastName,
                phoneNumber,
                request.DateOfBirth,
                request.Gender);

            // Update profile image if provided
            if (!string.IsNullOrWhiteSpace(request.ProfileImageUrl))
            {
                user.UpdateProfileImage(request.ProfileImageUrl);
            }

            // Update preferences if provided
            if (request.Preferences != null)
            {
                UpdateUserPreferences(user, request.Preferences);
            }

            // Save changes
            await _unitOfWork.Users.UpdateAsync(user, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Publish domain events
            user.AddDomainEvent(new UserUpdatedEvent(user));
            await _domainEventService.PublishAsync(user.DomainEvents, cancellationToken);

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
            return Result<UserDto>.Failure($"Failed to update user: {ex.Message}");
        }
    }

    private static void UpdateUserPreferences(Domain.Entities.User user, UserService.Application.Users.Commands.CreateUser.UserPreferencesDto preferencesDto)
    {
        var currentPreferences = user.Preferences;

        // Update language
        if (!string.IsNullOrWhiteSpace(preferencesDto.Language) && 
            preferencesDto.Language != currentPreferences.Language)
        {
            currentPreferences.UpdateLanguage(preferencesDto.Language);
        }

        // Update currency
        if (!string.IsNullOrWhiteSpace(preferencesDto.Currency) && 
            preferencesDto.Currency != currentPreferences.Currency)
        {
            currentPreferences.UpdateCurrency(preferencesDto.Currency);
        }

        // Update timezone
        if (!string.IsNullOrWhiteSpace(preferencesDto.TimeZone) && 
            preferencesDto.TimeZone != currentPreferences.TimeZone)
        {
            currentPreferences.UpdateTimeZone(preferencesDto.TimeZone);
        }

        // Update notification settings
        var newNotificationSettings = new NotificationSettings(
            preferencesDto.NotificationSettings.EmailNotifications,
            preferencesDto.NotificationSettings.SmsNotifications,
            preferencesDto.NotificationSettings.PushNotifications,
            preferencesDto.NotificationSettings.MarketingEmails,
            preferencesDto.NotificationSettings.OrderUpdates,
            preferencesDto.NotificationSettings.SecurityAlerts,
            preferencesDto.NotificationSettings.NewsletterSubscription);

        currentPreferences.UpdateNotificationSettings(newNotificationSettings);

        // Update privacy settings
        var newPrivacySettings = new PrivacySettings(
            preferencesDto.PrivacySettings.ProfileVisibility,
            preferencesDto.PrivacySettings.ShowOnlineStatus,
            preferencesDto.PrivacySettings.AllowDataCollection,
            preferencesDto.PrivacySettings.AllowPersonalization,
            preferencesDto.PrivacySettings.AllowThirdPartySharing);

        currentPreferences.UpdatePrivacySettings(newPrivacySettings);

        // Update custom settings
        foreach (var customSetting in preferencesDto.CustomSettings)
        {
            currentPreferences.SetCustomSetting(customSetting.Key, customSetting.Value);
        }
    }
}
