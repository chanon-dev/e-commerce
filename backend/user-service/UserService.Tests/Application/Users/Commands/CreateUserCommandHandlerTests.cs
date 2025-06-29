using AutoMapper;
using Moq;
using UserService.Application.Common.Interfaces;
using UserService.Application.Common.Mappings;
using UserService.Application.Users.Commands.CreateUser;
using UserService.Domain.Entities;
using UserService.Domain.ValueObjects;
using Xunit;

namespace UserService.Tests.Application.Users.Commands;

public class CreateUserCommandHandlerTests
{
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IUserRepository> _mockUserRepository;
    private readonly Mock<IRoleRepository> _mockRoleRepository;
    private readonly Mock<IDomainEventService> _mockDomainEventService;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly Mock<ITokenService> _mockTokenService;
    private readonly IMapper _mapper;
    private readonly CreateUserCommandHandler _handler;

    public CreateUserCommandHandlerTests()
    {
        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockUserRepository = new Mock<IUserRepository>();
        _mockRoleRepository = new Mock<IRoleRepository>();
        _mockDomainEventService = new Mock<IDomainEventService>();
        _mockEmailService = new Mock<IEmailService>();
        _mockTokenService = new Mock<ITokenService>();

        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = config.CreateMapper();

        _mockUnitOfWork.Setup(x => x.Users).Returns(_mockUserRepository.Object);
        _mockUnitOfWork.Setup(x => x.Roles).Returns(_mockRoleRepository.Object);

        _handler = new CreateUserCommandHandler(
            _mockUnitOfWork.Object,
            _mapper,
            _mockDomainEventService.Object,
            _mockEmailService.Object,
            _mockTokenService.Object);
    }

    [Fact]
    public async Task Handle_WithValidCommand_ShouldCreateUser()
    {
        // Arrange
        var command = new CreateUserCommand
        {
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe",
            PhoneNumber = "+66812345678"
        };

        _mockUserRepository.Setup(x => x.EmailExistsAsync(It.IsAny<Email>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _mockUserRepository.Setup(x => x.PhoneNumberExistsAsync(It.IsAny<PhoneNumber>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var customerRole = Role.CreateCustomerRole();
        _mockRoleRepository.Setup(x => x.GetByNameAsync("Customer", It.IsAny<CancellationToken>()))
            .ReturnsAsync(customerRole);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal(command.Email, result.Value.Email);
        Assert.Equal(command.FirstName, result.Value.FirstName);
        Assert.Equal(command.LastName, result.Value.LastName);

        _mockUserRepository.Verify(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockDomainEventService.Verify(x => x.PublishAsync(It.IsAny<IEnumerable<Domain.Common.IDomainEvent>>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithExistingEmail_ShouldReturnFailure()
    {
        // Arrange
        var command = new CreateUserCommand
        {
            Email = "existing@example.com",
            FirstName = "John",
            LastName = "Doe"
        };

        _mockUserRepository.Setup(x => x.EmailExistsAsync(It.IsAny<Email>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Email already exists", result.Error);

        _mockUserRepository.Verify(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithExistingPhoneNumber_ShouldReturnFailure()
    {
        // Arrange
        var command = new CreateUserCommand
        {
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe",
            PhoneNumber = "+66812345678"
        };

        _mockUserRepository.Setup(x => x.EmailExistsAsync(It.IsAny<Email>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _mockUserRepository.Setup(x => x.PhoneNumberExistsAsync(It.IsAny<PhoneNumber>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal("Phone number already exists", result.Error);

        _mockUserRepository.Verify(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithInvalidEmail_ShouldReturnFailure()
    {
        // Arrange
        var command = new CreateUserCommand
        {
            Email = "invalid-email",
            FirstName = "John",
            LastName = "Doe"
        };

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Contains("Invalid email format", result.Error);

        _mockUserRepository.Verify(x => x.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockUnitOfWork.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WithCustomRoles_ShouldAssignRoles()
    {
        // Arrange
        var command = new CreateUserCommand
        {
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe",
            Roles = new List<string> { "Manager", "Support" }
        };

        _mockUserRepository.Setup(x => x.EmailExistsAsync(It.IsAny<Email>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var managerRole = Role.CreateManagerRole();
        var supportRole = Role.CreateSupportRole();

        _mockRoleRepository.Setup(x => x.GetByNameAsync("Manager", It.IsAny<CancellationToken>()))
            .ReturnsAsync(managerRole);
        _mockRoleRepository.Setup(x => x.GetByNameAsync("Support", It.IsAny<CancellationToken>()))
            .ReturnsAsync(supportRole);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        _mockRoleRepository.Verify(x => x.GetByNameAsync("Manager", It.IsAny<CancellationToken>()), Times.Once);
        _mockRoleRepository.Verify(x => x.GetByNameAsync("Support", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldSendWelcomeEmail()
    {
        // Arrange
        var command = new CreateUserCommand
        {
            Email = "test@example.com",
            FirstName = "John",
            LastName = "Doe"
        };

        _mockUserRepository.Setup(x => x.EmailExistsAsync(It.IsAny<Email>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var customerRole = Role.CreateCustomerRole();
        _mockRoleRepository.Setup(x => x.GetByNameAsync("Customer", It.IsAny<CancellationToken>()))
            .ReturnsAsync(customerRole);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        _mockEmailService.Verify(x => x.SendWelcomeEmailAsync(
            command.Email,
            command.FirstName,
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
