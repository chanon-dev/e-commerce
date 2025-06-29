using UserService.Domain.ValueObjects;
using Xunit;

namespace UserService.Tests.Domain.ValueObjects;

public class EmailTests
{
    [Theory]
    [InlineData("test@example.com")]
    [InlineData("user.name@domain.co.uk")]
    [InlineData("test+tag@example.org")]
    [InlineData("123@456.com")]
    public void CreateEmail_WithValidEmail_ShouldCreateEmail(string emailValue)
    {
        // Act
        var email = new Email(emailValue);

        // Assert
        Assert.Equal(emailValue.ToLowerInvariant(), email.Value);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void CreateEmail_WithEmptyOrNullEmail_ShouldThrowArgumentException(string emailValue)
    {
        // Act & Assert
        Assert.Throws<ArgumentException>(() => new Email(emailValue));
    }

    [Theory]
    [InlineData("invalid-email")]
    [InlineData("@example.com")]
    [InlineData("test@")]
    [InlineData("test.example.com")]
    [InlineData("test@.com")]
    [InlineData("test@com")]
    public void CreateEmail_WithInvalidFormat_ShouldThrowArgumentException(string emailValue)
    {
        // Act & Assert
        Assert.Throws<ArgumentException>(() => new Email(emailValue));
    }

    [Fact]
    public void CreateEmail_WithTooLongEmail_ShouldThrowArgumentException()
    {
        // Arrange
        var longEmail = new string('a', 250) + "@example.com"; // Over 254 characters

        // Act & Assert
        Assert.Throws<ArgumentException>(() => new Email(longEmail));
    }

    [Fact]
    public void GetDomain_ShouldReturnCorrectDomain()
    {
        // Arrange
        var email = new Email("test@example.com");

        // Act
        var domain = email.GetDomain();

        // Assert
        Assert.Equal("example.com", domain);
    }

    [Fact]
    public void GetLocalPart_ShouldReturnCorrectLocalPart()
    {
        // Arrange
        var email = new Email("test@example.com");

        // Act
        var localPart = email.GetLocalPart();

        // Assert
        Assert.Equal("test", localPart);
    }

    [Fact]
    public void IsFromDomain_WithMatchingDomain_ShouldReturnTrue()
    {
        // Arrange
        var email = new Email("test@example.com");

        // Act & Assert
        Assert.True(email.IsFromDomain("example.com"));
        Assert.True(email.IsFromDomain("EXAMPLE.COM")); // Case insensitive
    }

    [Fact]
    public void IsFromDomain_WithNonMatchingDomain_ShouldReturnFalse()
    {
        // Arrange
        var email = new Email("test@example.com");

        // Act & Assert
        Assert.False(email.IsFromDomain("other.com"));
    }

    [Fact]
    public void Equals_WithSameEmail_ShouldReturnTrue()
    {
        // Arrange
        var email1 = new Email("test@example.com");
        var email2 = new Email("TEST@EXAMPLE.COM");

        // Act & Assert
        Assert.True(email1.Equals(email2));
        Assert.True(email1 == email2);
        Assert.Equal(email1.GetHashCode(), email2.GetHashCode());
    }

    [Fact]
    public void Equals_WithDifferentEmail_ShouldReturnFalse()
    {
        // Arrange
        var email1 = new Email("test1@example.com");
        var email2 = new Email("test2@example.com");

        // Act & Assert
        Assert.False(email1.Equals(email2));
        Assert.True(email1 != email2);
    }

    [Fact]
    public void ImplicitConversion_FromString_ShouldWork()
    {
        // Act
        Email email = "test@example.com";

        // Assert
        Assert.Equal("test@example.com", email.Value);
    }

    [Fact]
    public void ImplicitConversion_ToString_ShouldWork()
    {
        // Arrange
        var email = new Email("test@example.com");

        // Act
        string emailString = email;

        // Assert
        Assert.Equal("test@example.com", emailString);
    }

    [Fact]
    public void ToString_ShouldReturnEmailValue()
    {
        // Arrange
        var email = new Email("test@example.com");

        // Act
        var result = email.ToString();

        // Assert
        Assert.Equal("test@example.com", result);
    }
}
