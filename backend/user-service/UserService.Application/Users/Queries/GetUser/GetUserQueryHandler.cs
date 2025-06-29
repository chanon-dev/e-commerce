using AutoMapper;
using MediatR;
using UserService.Application.Common.Interfaces;
using UserService.Application.Common.Models;
using UserService.Application.Users.Common;
using UserService.Domain.Entities;

namespace UserService.Application.Users.Queries.GetUser;

public class GetUserQueryHandler : IRequestHandler<GetUserQuery, Result<UserDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ICacheService _cacheService;

    public GetUserQueryHandler(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ICacheService cacheService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _cacheService = cacheService;
    }

    public async Task<Result<UserDto>> Handle(GetUserQuery request, CancellationToken cancellationToken)
    {
        try
        {
            // Try to get from cache first
            var cacheKey = GenerateCacheKey(request);
            var cachedUser = await _cacheService.GetAsync<UserDto>(cacheKey, cancellationToken);
            if (cachedUser != null)
            {
                return Result<UserDto>.Success(cachedUser);
            }

            // Get user from database
            User? user = null;

            if (request.IncludeAll)
            {
                user = await _unitOfWork.Users.GetCompleteAsync(request.Id, cancellationToken);
            }
            else if (request.IncludeAddresses && request.IncludeRoles && request.IncludeSessions)
            {
                user = await _unitOfWork.Users.GetCompleteAsync(request.Id, cancellationToken);
            }
            else if (request.IncludeAddresses)
            {
                user = await _unitOfWork.Users.GetWithAddressesAsync(request.Id, cancellationToken);
            }
            else if (request.IncludeRoles)
            {
                user = await _unitOfWork.Users.GetWithRolesAsync(request.Id, cancellationToken);
            }
            else if (request.IncludeSessions)
            {
                user = await _unitOfWork.Users.GetWithSessionsAsync(request.Id, cancellationToken);
            }
            else
            {
                user = await _unitOfWork.Users.GetByIdAsync(request.Id, cancellationToken);
            }

            if (user == null)
            {
                return Result<UserDto>.Failure("User not found");
            }

            // Map to DTO
            var userDto = _mapper.Map<UserDto>(user);

            // Cache the result
            await _cacheService.SetAsync(cacheKey, userDto, TimeSpan.FromMinutes(15), cancellationToken);

            return Result<UserDto>.Success(userDto);
        }
        catch (Exception ex)
        {
            return Result<UserDto>.Failure($"Failed to get user: {ex.Message}");
        }
    }

    private static string GenerateCacheKey(GetUserQuery request)
    {
        var keyParts = new List<string>
        {
            "user",
            request.Id.ToString()
        };

        if (request.IncludeAll)
        {
            keyParts.Add("complete");
        }
        else
        {
            if (request.IncludeAddresses) keyParts.Add("addresses");
            if (request.IncludeRoles) keyParts.Add("roles");
            if (request.IncludeSessions) keyParts.Add("sessions");
        }

        return string.Join(":", keyParts);
    }
}
