using MediatR;
using UserService.Application.Common.Interfaces;
using UserService.Domain.Entities;
using UserService.Domain.ValueObjects;
using UserService.Application.Common.Exceptions;

namespace UserService.Application.Commands;

// Command (CQRS Pattern)
public record CreateUserCommand(
    string Email,
    string FirstName,
    string LastName,
    string? PhoneNumber = null
) : IRequest<CreateUserResponse>;

public record CreateUserResponse(
    Guid UserId,
    string Email,
    string FullName,
    DateTime CreatedAt
);

// Command Handler
public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, CreateUserResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateUserCommandHandler> _logger;

    public CreateUserCommandHandler(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        ILogger<CreateUserCommandHandler> logger)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<CreateUserResponse> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating user with email: {Email}", request.Email);

        // Validate business rules
        await ValidateBusinessRules(request, cancellationToken);

        // Create value objects
        var email = Email.Create(request.Email);
        var name = PersonName.Create(request.FirstName, request.LastName);
        var phoneNumber = !string.IsNullOrEmpty(request.PhoneNumber) 
            ? PhoneNumber.Create(request.PhoneNumber) 
            : null;

        // Create domain entity
        var user = User.Create(email, name, phoneNumber);

        // Save to repository
        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User created successfully with ID: {UserId}", user.Id);

        // Return response
        return new CreateUserResponse(
            user.Id,
            user.Email.Value,
            user.Name.FullName,
            user.CreatedAt
        );
    }

    private async Task ValidateBusinessRules(CreateUserCommand request, CancellationToken cancellationToken)
    {
        // Check if email already exists
        var existingUser = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (existingUser != null)
        {
            throw new BusinessRuleValidationException("User with this email already exists");
        }

        // Additional business rules can be added here
        if (string.IsNullOrWhiteSpace(request.FirstName) || request.FirstName.Length < 2)
        {
            throw new BusinessRuleValidationException("First name must be at least 2 characters long");
        }

        if (string.IsNullOrWhiteSpace(request.LastName) || request.LastName.Length < 2)
        {
            throw new BusinessRuleValidationException("Last name must be at least 2 characters long");
        }
    }
}

// Command Validator (FluentValidation)
public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(255);

        RuleFor(x => x.FirstName)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(50);

        RuleFor(x => x.LastName)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(50);

        RuleFor(x => x.PhoneNumber)
            .Matches(@"^\+?[1-9]\d{1,14}$")
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber))
            .WithMessage("Phone number must be in valid international format");
    }
}
