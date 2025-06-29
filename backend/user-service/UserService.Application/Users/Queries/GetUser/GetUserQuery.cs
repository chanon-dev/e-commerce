using MediatR;
using UserService.Application.Common.Models;
using UserService.Application.Users.Common;

namespace UserService.Application.Users.Queries.GetUser;

public class GetUserQuery : IRequest<Result<UserDto>>
{
    public Guid Id { get; set; }
    public bool IncludeAddresses { get; set; } = false;
    public bool IncludeRoles { get; set; } = false;
    public bool IncludeSessions { get; set; } = false;
    public bool IncludeAll { get; set; } = false;

    public GetUserQuery() { }

    public GetUserQuery(Guid id)
    {
        Id = id;
    }

    public GetUserQuery(Guid id, bool includeAll)
    {
        Id = id;
        IncludeAll = includeAll;
        if (includeAll)
        {
            IncludeAddresses = true;
            IncludeRoles = true;
            IncludeSessions = true;
        }
    }
}
