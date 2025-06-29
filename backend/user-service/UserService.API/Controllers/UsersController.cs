using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserService.Application.Common.Models;
using UserService.Application.Users.Commands.CreateUser;
using UserService.Application.Users.Commands.UpdateUser;
using UserService.Application.Users.Common;
using UserService.Application.Users.Queries.GetUser;
using UserService.Application.Users.Queries.GetUsers;

namespace UserService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IMediator mediator, ILogger<UsersController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all users with pagination and filtering
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<ActionResult<ApiResponse<PagedResult<UserDto>>>> GetUsers(
        [FromQuery] GetUsersQuery query,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(query, cancellationToken);

            if (result.IsFailure)
            {
                return BadRequest(ApiResponse<PagedResult<UserDto>>.ErrorResponse(result.Error));
            }

            return Ok(ApiResponse<PagedResult<UserDto>>.SuccessResponse(result.Value!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users");
            return StatusCode(500, ApiResponse<PagedResult<UserDto>>.ErrorResponse("Internal server error"));
        }
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetUser(
        Guid id,
        [FromQuery] bool includeAddresses = false,
        [FromQuery] bool includeRoles = false,
        [FromQuery] bool includeSessions = false,
        [FromQuery] bool includeAll = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = new GetUserQuery
            {
                Id = id,
                IncludeAddresses = includeAddresses,
                IncludeRoles = includeRoles,
                IncludeSessions = includeSessions,
                IncludeAll = includeAll
            };

            var result = await _mediator.Send(query, cancellationToken);

            if (result.IsFailure)
            {
                if (result.Error == "User not found")
                {
                    return NotFound(ApiResponse<UserDto>.ErrorResponse(result.Error));
                }
                return BadRequest(ApiResponse<UserDto>.ErrorResponse(result.Error));
            }

            return Ok(ApiResponse<UserDto>.SuccessResponse(result.Value!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId}", id);
            return StatusCode(500, ApiResponse<UserDto>.ErrorResponse("Internal server error"));
        }
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateUser(
        [FromBody] CreateUserCommand command,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(command, cancellationToken);

            if (result.IsFailure)
            {
                return BadRequest(ApiResponse<UserDto>.ErrorResponse(result.Error));
            }

            var user = result.Value!;
            return CreatedAtAction(
                nameof(GetUser),
                new { id = user.Id },
                ApiResponse<UserDto>.SuccessResponse(user, "User created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, ApiResponse<UserDto>.ErrorResponse("Internal server error"));
        }
    }

    /// <summary>
    /// Update an existing user
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUser(
        Guid id,
        [FromBody] UpdateUserCommand command,
        CancellationToken cancellationToken)
    {
        try
        {
            if (id != command.Id)
            {
                return BadRequest(ApiResponse<UserDto>.ErrorResponse("ID mismatch"));
            }

            var result = await _mediator.Send(command, cancellationToken);

            if (result.IsFailure)
            {
                if (result.Error == "User not found")
                {
                    return NotFound(ApiResponse<UserDto>.ErrorResponse(result.Error));
                }
                return BadRequest(ApiResponse<UserDto>.ErrorResponse(result.Error));
            }

            return Ok(ApiResponse<UserDto>.SuccessResponse(result.Value!, "User updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", id);
            return StatusCode(500, ApiResponse<UserDto>.ErrorResponse("Internal server error"));
        }
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetCurrentUser(CancellationToken cancellationToken)
    {
        try
        {
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse<UserDto>.ErrorResponse("Invalid user token"));
            }

            var query = new GetUserQuery(userId, includeAll: true);
            var result = await _mediator.Send(query, cancellationToken);

            if (result.IsFailure)
            {
                return NotFound(ApiResponse<UserDto>.ErrorResponse(result.Error));
            }

            return Ok(ApiResponse<UserDto>.SuccessResponse(result.Value!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, ApiResponse<UserDto>.ErrorResponse("Internal server error"));
        }
    }

    /// <summary>
    /// Update current user profile
    /// </summary>
    [HttpPut("me")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateCurrentUser(
        [FromBody] UpdateUserCommand command,
        CancellationToken cancellationToken)
    {
        try
        {
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse<UserDto>.ErrorResponse("Invalid user token"));
            }

            command.Id = userId;
            var result = await _mediator.Send(command, cancellationToken);

            if (result.IsFailure)
            {
                return BadRequest(ApiResponse<UserDto>.ErrorResponse(result.Error));
            }

            return Ok(ApiResponse<UserDto>.SuccessResponse(result.Value!, "Profile updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating current user profile");
            return StatusCode(500, ApiResponse<UserDto>.ErrorResponse("Internal server error"));
        }
    }

    /// <summary>
    /// Search users
    /// </summary>
    [HttpGet("search")]
    [Authorize(Roles = "Administrator,Manager,Support")]
    public async Task<ActionResult<ApiResponse<PagedResult<UserSummaryDto>>>> SearchUsers(
        [FromQuery] string? searchTerm,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = new GetUsersQuery(page, pageSize)
            {
                SearchTerm = searchTerm
            };

            var result = await _mediator.Send(query, cancellationToken);

            if (result.IsFailure)
            {
                return BadRequest(ApiResponse<PagedResult<UserSummaryDto>>.ErrorResponse(result.Error));
            }

            // Map to summary DTOs for search results
            var summaryResult = new PagedResult<UserSummaryDto>(
                result.Value!.Items.Select(u => new UserSummaryDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FullName = u.FullName,
                    Status = u.Status,
                    IsEmailVerified = u.IsEmailVerified,
                    IsPhoneVerified = u.IsPhoneVerified,
                    ProfileImageUrl = u.ProfileImageUrl,
                    CreatedAt = u.CreatedAt,
                    Roles = u.Roles.Select(r => r.RoleName).ToList()
                }),
                result.Value.TotalCount,
                result.Value.Page,
                result.Value.PageSize);

            return Ok(ApiResponse<PagedResult<UserSummaryDto>>.SuccessResponse(summaryResult));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users with term: {SearchTerm}", searchTerm);
            return StatusCode(500, ApiResponse<PagedResult<UserSummaryDto>>.ErrorResponse("Internal server error"));
        }
    }

    /// <summary>
    /// Check if email exists
    /// </summary>
    [HttpGet("check-email")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<bool>>> CheckEmailExists(
        [FromQuery] string email,
        CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(ApiResponse<bool>.ErrorResponse("Email is required"));
            }

            // This would typically be a separate query/command
            // For now, we'll use a simple approach
            var emailObj = new Domain.ValueObjects.Email(email);
            // Implementation would check via repository
            // var exists = await _userRepository.EmailExistsAsync(emailObj, cancellationToken);
            
            return Ok(ApiResponse<bool>.SuccessResponse(false)); // Placeholder
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<bool>.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking email existence: {Email}", email);
            return StatusCode(500, ApiResponse<bool>.ErrorResponse("Internal server error"));
        }
    }

    /// <summary>
    /// Get user statistics (for admin dashboard)
    /// </summary>
    [HttpGet("statistics")]
    [Authorize(Roles = "Administrator,Manager")]
    public async Task<ActionResult<ApiResponse<UserStatisticsDto>>> GetUserStatistics(
        CancellationToken cancellationToken)
    {
        try
        {
            // This would be implemented as a separate query
            var statistics = new UserStatisticsDto
            {
                TotalUsers = 0,
                ActiveUsers = 0,
                VerifiedUsers = 0,
                NewUsersThisMonth = 0,
                UsersByRole = new Dictionary<string, int>()
            };

            return Ok(ApiResponse<UserStatisticsDto>.SuccessResponse(statistics));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user statistics");
            return StatusCode(500, ApiResponse<UserStatisticsDto>.ErrorResponse("Internal server error"));
        }
    }
}

public class UserStatisticsDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int VerifiedUsers { get; set; }
    public int NewUsersThisMonth { get; set; }
    public Dictionary<string, int> UsersByRole { get; set; } = new();
}
