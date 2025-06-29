using MediatR;
using UserService.Application.Common.Models;
using UserService.Application.Users.Commands.CreateUser;
using UserService.Application.Users.Common;
using UserService.Domain.Entities;

namespace UserService.Application.Users.Commands.UpdateUser;

public class UpdateUserCommand : IRequest<Result<UserDto>>
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public string? ProfileImageUrl { get; set; }
    public UserPreferencesDto? Preferences { get; set; }
}
