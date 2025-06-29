using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UserService.Domain.Entities;

namespace UserService.Infrastructure.Data.Configurations;

public class UserAddressConfiguration : IEntityTypeConfiguration<UserAddress>
{
    public void Configure(EntityTypeBuilder<UserAddress> builder)
    {
        builder.ToTable("UserAddresses");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Id)
            .ValueGeneratedNever();

        builder.Property(a => a.UserId)
            .IsRequired();

        builder.Property(a => a.Label)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(a => a.FirstName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(a => a.LastName)
            .HasMaxLength(100)
            .IsRequired();

        // PhoneNumber value object
        builder.OwnsOne(a => a.PhoneNumber, phone =>
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
        });

        builder.Property(a => a.AddressLine1)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(a => a.AddressLine2)
            .HasMaxLength(200);

        builder.Property(a => a.City)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(a => a.State)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(a => a.PostalCode)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(a => a.Country)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(a => a.Type)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(a => a.Latitude)
            .HasPrecision(10, 8);

        builder.Property(a => a.Longitude)
            .HasPrecision(11, 8);

        builder.Property(a => a.DeliveryInstructions)
            .HasMaxLength(500);

        // Audit fields
        builder.Property(a => a.CreatedAt)
            .IsRequired();

        builder.Property(a => a.CreatedBy)
            .HasMaxLength(100);

        builder.Property(a => a.ModifiedAt);

        builder.Property(a => a.ModifiedBy)
            .HasMaxLength(100);

        // Indexes
        builder.HasIndex(a => a.UserId)
            .HasDatabaseName("IX_UserAddresses_UserId");

        builder.HasIndex(a => new { a.UserId, a.IsDefault })
            .HasDatabaseName("IX_UserAddresses_UserId_IsDefault")
            .HasFilter("[IsDefault] = 1");

        builder.HasIndex(a => a.Country)
            .HasDatabaseName("IX_UserAddresses_Country");

        builder.HasIndex(a => new { a.Latitude, a.Longitude })
            .HasDatabaseName("IX_UserAddresses_Coordinates")
            .HasFilter("[Latitude] IS NOT NULL AND [Longitude] IS NOT NULL");

        // Relationships
        builder.HasOne(a => a.User)
            .WithMany(u => u.Addresses)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Ignore domain events and computed properties
        builder.Ignore(a => a.DomainEvents);
    }
}
