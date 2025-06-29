using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Text.Json;
using UserService.Domain.Entities;

namespace UserService.Infrastructure.Data.Configurations;

public class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.ToTable("UserSessions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .ValueGeneratedNever();

        builder.Property(s => s.UserId)
            .IsRequired();

        builder.Property(s => s.SessionToken)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(s => s.RefreshToken)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(s => s.DeviceInfo)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(s => s.IpAddress)
            .HasMaxLength(45) // IPv6 max length
            .IsRequired();

        builder.Property(s => s.UserAgent)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(s => s.Location)
            .HasMaxLength(200);

        builder.Property(s => s.Type)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        builder.Property(s => s.ExpiresAt)
            .IsRequired();

        // Metadata as JSON
        builder.Property(s => s.Metadata)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, object>())
            .HasColumnType("nvarchar(max)");

        // Indexes
        builder.HasIndex(s => s.UserId)
            .HasDatabaseName("IX_UserSessions_UserId");

        builder.HasIndex(s => s.SessionToken)
            .IsUnique()
            .HasDatabaseName("IX_UserSessions_SessionToken");

        builder.HasIndex(s => s.RefreshToken)
            .IsUnique()
            .HasDatabaseName("IX_UserSessions_RefreshToken");

        builder.HasIndex(s => new { s.UserId, s.IsActive })
            .HasDatabaseName("IX_UserSessions_UserId_IsActive")
            .HasFilter("[IsActive] = 1");

        builder.HasIndex(s => s.ExpiresAt)
            .HasDatabaseName("IX_UserSessions_ExpiresAt");

        builder.HasIndex(s => new { s.IsActive, s.ExpiresAt })
            .HasDatabaseName("IX_UserSessions_IsActive_ExpiresAt");

        builder.HasIndex(s => s.IpAddress)
            .HasDatabaseName("IX_UserSessions_IpAddress");

        builder.HasIndex(s => s.Type)
            .HasDatabaseName("IX_UserSessions_Type");

        // Relationships
        builder.HasOne(s => s.User)
            .WithMany(u => u.Sessions)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Ignore domain events
        builder.Ignore(s => s.DomainEvents);
    }
}
