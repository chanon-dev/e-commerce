using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Text.Json;
using UserService.Domain.Entities;
using UserService.Domain.ValueObjects;

namespace UserService.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Id)
            .ValueGeneratedNever();

        // Email value object
        builder.OwnsOne(u => u.Email, email =>
        {
            email.Property(e => e.Value)
                .HasColumnName("Email")
                .HasMaxLength(254)
                .IsRequired();

            email.HasIndex(e => e.Value)
                .IsUnique()
                .HasDatabaseName("IX_Users_Email");
        });

        // PhoneNumber value object
        builder.OwnsOne(u => u.PhoneNumber, phone =>
        {
            phone.Property(p => p.Value)
                .HasColumnName("PhoneNumber")
                .HasMaxLength(20);

            phone.Property(p => p.CountryCode)
                .HasColumnName("PhoneCountryCode")
                .HasMaxLength(5);

            phone.Property(p => p.NationalNumber)
                .HasColumnName("PhoneNationalNumber")
                .HasMaxLength(15);

            phone.HasIndex(p => p.Value)
                .IsUnique()
                .HasDatabaseName("IX_Users_PhoneNumber")
                .HasFilter("[PhoneNumber] IS NOT NULL");
        });

        builder.Property(u => u.FirstName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(u => u.LastName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(u => u.DateOfBirth)
            .HasColumnType("date");

        builder.Property(u => u.Gender)
            .HasConversion<int>();

        builder.Property(u => u.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(u => u.ProfileImageUrl)
            .HasMaxLength(500);

        // UserPreferences value object
        builder.OwnsOne(u => u.Preferences, prefs =>
        {
            prefs.Property(p => p.Language)
                .HasColumnName("PreferenceLanguage")
                .HasMaxLength(10)
                .IsRequired();

            prefs.Property(p => p.Currency)
                .HasColumnName("PreferenceCurrency")
                .HasMaxLength(10)
                .IsRequired();

            prefs.Property(p => p.TimeZone)
                .HasColumnName("PreferenceTimeZone")
                .HasMaxLength(100)
                .IsRequired();

            // NotificationSettings as JSON
            prefs.OwnsOne(p => p.NotificationSettings, notif =>
            {
                notif.Property(n => n.EmailNotifications)
                    .HasColumnName("NotificationEmailEnabled");
                notif.Property(n => n.SmsNotifications)
                    .HasColumnName("NotificationSmsEnabled");
                notif.Property(n => n.PushNotifications)
                    .HasColumnName("NotificationPushEnabled");
                notif.Property(n => n.MarketingEmails)
                    .HasColumnName("NotificationMarketingEnabled");
                notif.Property(n => n.OrderUpdates)
                    .HasColumnName("NotificationOrderUpdatesEnabled");
                notif.Property(n => n.SecurityAlerts)
                    .HasColumnName("NotificationSecurityAlertsEnabled");
                notif.Property(n => n.NewsletterSubscription)
                    .HasColumnName("NotificationNewsletterEnabled");
            });

            // PrivacySettings as JSON
            prefs.OwnsOne(p => p.PrivacySettings, privacy =>
            {
                privacy.Property(pr => pr.ProfileVisibility)
                    .HasColumnName("PrivacyProfileVisible");
                privacy.Property(pr => pr.ShowOnlineStatus)
                    .HasColumnName("PrivacyShowOnlineStatus");
                privacy.Property(pr => pr.AllowDataCollection)
                    .HasColumnName("PrivacyAllowDataCollection");
                privacy.Property(pr => pr.AllowPersonalization)
                    .HasColumnName("PrivacyAllowPersonalization");
                privacy.Property(pr => pr.AllowThirdPartySharing)
                    .HasColumnName("PrivacyAllowThirdPartySharing");
            });

            // CustomSettings as JSON
            prefs.Property(p => p.CustomSettings)
                .HasColumnName("PreferenceCustomSettings")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, object>())
                .HasColumnType("nvarchar(max)");
        });

        // Audit fields
        builder.Property(u => u.CreatedAt)
            .IsRequired();

        builder.Property(u => u.CreatedBy)
            .HasMaxLength(100);

        builder.Property(u => u.ModifiedAt);

        builder.Property(u => u.ModifiedBy)
            .HasMaxLength(100);

        // Indexes
        builder.HasIndex(u => u.Status)
            .HasDatabaseName("IX_Users_Status");

        builder.HasIndex(u => u.CreatedAt)
            .HasDatabaseName("IX_Users_CreatedAt");

        builder.HasIndex(u => new { u.FirstName, u.LastName })
            .HasDatabaseName("IX_Users_FullName");

        // Relationships
        builder.HasMany(u => u.Addresses)
            .WithOne(a => a.User)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.UserRoles)
            .WithOne(ur => ur.User)
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.Sessions)
            .WithOne(s => s.User)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Ignore domain events (they're not persisted)
        builder.Ignore(u => u.DomainEvents);

        // Computed properties (read-only)
        builder.Ignore(u => u.FullName);
        builder.Ignore(u => u.Age);
        builder.Ignore(u => u.IsEmailVerified);
        builder.Ignore(u => u.IsPhoneVerified);
        builder.Ignore(u => u.IsActive);
    }
}
