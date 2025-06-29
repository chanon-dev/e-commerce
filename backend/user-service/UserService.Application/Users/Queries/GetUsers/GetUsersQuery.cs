using MediatR;
using UserService.Application.Common.Models;
using UserService.Application.Users.Common;
using UserService.Domain.Entities;

namespace UserService.Application.Users.Queries.GetUsers;

public class GetUsersQuery : IRequest<Result<PagedResult<UserDto>>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public string? SearchTerm { get; set; }
    public UserStatus? Status { get; set; }
    public string? Role { get; set; }
    public DateTime? CreatedFrom { get; set; }
    public DateTime? CreatedTo { get; set; }
    public bool? IsEmailVerified { get; set; }
    public bool? IsPhoneVerified { get; set; }
    public string? SortBy { get; set; } = "CreatedAt";
    public string? SortDirection { get; set; } = "desc";

    public GetUsersQuery() { }

    public GetUsersQuery(int page, int pageSize)
    {
        Page = Math.Max(1, page);
        PageSize = Math.Min(100, Math.Max(1, pageSize)); // Limit max page size to 100
    }
}
