using UserService.Domain.Entities;
using UserService.Domain.ValueObjects;
using Xunit;

namespace UserService.Tests.Domain.Entities;

public class UserTests
{
    [Fact]
    public void CreateUser_WithValidData_ShouldCreateUser()
    {
        // Arrange
        var email = new Email("test@example.com");
        var firstName = "John";
        var lastName = "Doe";
        var phoneNumber = new PhoneNumber("+66812345678");
        var dateOfBirth = new DateTime(1990, 1, 1);
        var gender = Gender.Male;

        // Act
        var user = new User(email, firstName, lastName, phoneNumber, dateOfBirth, gender);

        // Assert
        Assert.NotEqual(Guid.Empty, user.Id);
        Assert.Equal(email, user.Email);
        Assert.Equal(firstName, user.FirstName);
        Assert.Equal(lastName, user.LastName);
        Assert.Equal(phoneNumber, user.PhoneNumber);
        Assert.Equal(dateOfBirth, user.DateOfBirth);
        Assert.Equal(gender, user.Gender);
        Assert.Equal(UserStatus.Active, user.Status);
        Assert.False(user.IsEmailVerified);
        Assert.False(user.IsPhoneVerified);
        Assert.True(user.IsActive);
    }

    [Fact]
    public void CreateUser_WithNullEmail_ShouldThrowArgumentNullException()
    {
        // Arrange & Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new User(null!, "John", "Doe"));
    }

    [Fact]
    public void CreateUser_WithEmptyFirstName_ShouldThrowArgumentException()
    {
        // Arrange
        var email = new Email("test@example.com");

        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            new User(email, "", "Doe"));
    }

    [Fact]
    public void CreateUser_WithEmptyLastName_ShouldThrowArgumentException()
    {
        // Arrange
        var email = new Email("test@example.com");

        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            new User(email, "John", ""));
    }

    [Fact]
    public void UpdateProfile_WithValidData_ShouldUpdateUser()
    {
        // Arrange
        var user = CreateTestUser();
        var newFirstName = "Jane";
        var newLastName = "Smith";
        var newPhoneNumber = new PhoneNumber("+66887654321");

        // Act
        user.UpdateProfile(newFirstName, newLastName, newPhoneNumber);

        // Assert
        Assert.Equal(newFirstName, user.FirstName);
        Assert.Equal(newLastName, user.LastName);
        Assert.Equal(newPhoneNumber, user.PhoneNumber);
        Assert.NotNull(user.ModifiedAt);
    }

    [Fact]
    public void VerifyEmail_ShouldSetEmailVerifiedAt()
    {
        // Arrange
        var user = CreateTestUser();
        Assert.False(user.IsEmailVerified);

        // Act
        user.VerifyEmail();

        // Assert
        Assert.True(user.IsEmailVerified);
        Assert.NotNull(user.EmailVerifiedAt);
        Assert.NotNull(user.ModifiedAt);
    }

    [Fact]
    public void VerifyPhone_ShouldSetPhoneVerifiedAt()
    {
        // Arrange
        var user = CreateTestUser();
        Assert.False(user.IsPhoneVerified);

        // Act
        user.VerifyPhone();

        // Assert
        Assert.True(user.IsPhoneVerified);
        Assert.NotNull(user.PhoneVerifiedAt);
        Assert.NotNull(user.ModifiedAt);
    }

    [Fact]
    public void ChangeStatus_ShouldUpdateStatus()
    {
        // Arrange
        var user = CreateTestUser();
        Assert.Equal(UserStatus.Active, user.Status);

        // Act
        user.ChangeStatus(UserStatus.Suspended);

        // Assert
        Assert.Equal(UserStatus.Suspended, user.Status);
        Assert.False(user.IsActive);
        Assert.NotNull(user.ModifiedAt);
    }

    [Fact]
    public void AddAddress_WithValidAddress_ShouldAddAddress()
    {
        // Arrange
        var user = CreateTestUser();
        var address = CreateTestAddress(user.Id);

        // Act
        user.AddAddress(address);

        // Assert
        Assert.Contains(address, user.Addresses);
        Assert.NotNull(user.ModifiedAt);
    }

    [Fact]
    public void AddAddress_WithNullAddress_ShouldThrowArgumentNullException()
    {
        // Arrange
        var user = CreateTestUser();

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => user.AddAddress(null!));
    }

    [Fact]
    public void AssignRole_WithValidRole_ShouldAssignRole()
    {
        // Arrange
        var user = CreateTestUser();
        var role = CreateTestRole();

        // Act
        user.AssignRole(role);

        // Assert
        Assert.True(user.UserRoles.Any(ur => ur.RoleId == role.Id));
        Assert.NotNull(user.ModifiedAt);
    }

    [Fact]
    public void AssignRole_WithSameRoleTwice_ShouldNotDuplicate()
    {
        // Arrange
        var user = CreateTestUser();
        var role = CreateTestRole();

        // Act
        user.AssignRole(role);
        user.AssignRole(role);

        // Assert
        Assert.Single(user.UserRoles.Where(ur => ur.RoleId == role.Id));
    }

    [Fact]
    public void HasRole_WithAssignedRole_ShouldReturnTrue()
    {
        // Arrange
        var user = CreateTestUser();
        var role = CreateTestRole();
        user.AssignRole(role);

        // Act & Assert
        Assert.True(user.HasRole(role.Name));
    }

    [Fact]
    public void HasRole_WithoutAssignedRole_ShouldReturnFalse()
    {
        // Arrange
        var user = CreateTestUser();

        // Act & Assert
        Assert.False(user.HasRole("NonExistentRole"));
    }

    [Fact]
    public void FullName_ShouldReturnCombinedName()
    {
        // Arrange
        var user = CreateTestUser();

        // Act & Assert
        Assert.Equal("John Doe", user.FullName);
    }

    [Fact]
    public void Age_WithDateOfBirth_ShouldCalculateCorrectAge()
    {
        // Arrange
        var birthDate = DateTime.Today.AddYears(-25);
        var user = new User(
            new Email("test@example.com"),
            "John",
            "Doe",
            dateOfBirth: birthDate);

        // Act & Assert
        Assert.Equal(25, user.Age);
    }

    [Fact]
    public void Age_WithoutDateOfBirth_ShouldReturnZero()
    {
        // Arrange
        var user = CreateTestUser();

        // Act & Assert
        Assert.Equal(0, user.Age);
    }

    private static User CreateTestUser()
    {
        return new User(
            new Email("test@example.com"),
            "John",
            "Doe",
            new PhoneNumber("+66812345678"));
    }

    private static UserAddress CreateTestAddress(Guid userId)
    {
        return new UserAddress(
            userId,
            "Home",
            "John",
            "Doe",
            "123 Main St",
            "Bangkok",
            "Bangkok",
            "10110",
            "TH");
    }

    private static Role CreateTestRole()
    {
        return new Role("TestRole", "Test Role Description");
    }
}
