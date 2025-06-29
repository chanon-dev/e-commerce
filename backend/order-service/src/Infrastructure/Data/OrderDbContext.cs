using Microsoft.EntityFrameworkCore;
using OrderService.Domain.Entities;

namespace OrderService.Infrastructure.Data;

public class OrderDbContext : DbContext
{
    public OrderDbContext(DbContextOptions<OrderDbContext> options) : base(options)
    {
    }

    // DbSets
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;
    public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; } = null!;
    public DbSet<OrderPayment> OrderPayments { get; set; } = null!;
    public DbSet<OrderShippingAddress> OrderShippingAddresses { get; set; } = null!;
    public DbSet<OrderBillingAddress> OrderBillingAddresses { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Order entity
        modelBuilder.Entity<Order>(entity =>
        {
            // Indexes
            entity.HasIndex(e => e.OrderNumber)
                .IsUnique()
                .HasDatabaseName("IX_orders_order_number");

            entity.HasIndex(e => e.UserId)
                .HasDatabaseName("IX_orders_user_id");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("IX_orders_status");

            entity.HasIndex(e => e.PaymentStatus)
                .HasDatabaseName("IX_orders_payment_status");

            entity.HasIndex(e => e.OrderDate)
                .HasDatabaseName("IX_orders_order_date");

            entity.HasIndex(e => new { e.UserId, e.Status })
                .HasDatabaseName("IX_orders_user_status");

            entity.HasIndex(e => new { e.Status, e.OrderDate })
                .HasDatabaseName("IX_orders_status_date");

            entity.HasIndex(e => e.TrackingNumber)
                .HasDatabaseName("IX_orders_tracking_number");

            // Constraints
            entity.HasCheckConstraint("CK_orders_amounts_positive", 
                "subtotal >= 0 AND tax_amount >= 0 AND shipping_amount >= 0 AND discount_amount >= 0 AND total_amount >= 0");

            entity.HasCheckConstraint("CK_orders_total_calculation", 
                "total_amount = subtotal + tax_amount + shipping_amount - discount_amount");

            entity.HasCheckConstraint("CK_orders_currency_format", 
                "LENGTH(currency) = 3");

            entity.HasCheckConstraint("CK_orders_refund_amount", 
                "refund_amount >= 0 AND refund_amount <= total_amount");

            entity.HasCheckConstraint("CK_orders_tax_rate", 
                "tax_rate >= 0 AND tax_rate <= 1");

            // Default values
            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            entity.Property(e => e.OrderDate)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // JSON columns for PostgreSQL
            entity.Property(e => e.Metadata)
                .HasColumnType("jsonb");

            // Enum conversions
            entity.Property(e => e.Status)
                .HasConversion<string>();

            entity.Property(e => e.PaymentStatus)
                .HasConversion<string>();

            entity.Property(e => e.FulfillmentStatus)
                .HasConversion<string>();

            // Soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);

            // Configure relationships
            entity.HasMany(e => e.Items)
                .WithOne(e => e.Order)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.StatusHistory)
                .WithOne(e => e.Order)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Payments)
                .WithOne(e => e.Order)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ShippingAddress)
                .WithOne(e => e.Order)
                .HasForeignKey<OrderShippingAddress>(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.BillingAddress)
                .WithOne(e => e.Order)
                .HasForeignKey<OrderBillingAddress>(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure OrderItem entity
        modelBuilder.Entity<OrderItem>(entity =>
        {
            // Indexes
            entity.HasIndex(e => e.OrderId)
                .HasDatabaseName("IX_order_items_order_id");

            entity.HasIndex(e => e.ProductId)
                .HasDatabaseName("IX_order_items_product_id");

            entity.HasIndex(e => new { e.OrderId, e.ProductId })
                .HasDatabaseName("IX_order_items_order_product");

            entity.HasIndex(e => e.ProductSku)
                .HasDatabaseName("IX_order_items_product_sku");

            entity.HasIndex(e => e.FulfillmentStatus)
                .HasDatabaseName("IX_order_items_fulfillment_status");

            // Constraints
            entity.HasCheckConstraint("CK_order_items_quantity_positive", 
                "quantity > 0");

            entity.HasCheckConstraint("CK_order_items_prices_positive", 
                "unit_price >= 0 AND total_price >= 0 AND discount_amount >= 0 AND tax_amount >= 0");

            entity.HasCheckConstraint("CK_order_items_total_calculation", 
                "total_price = unit_price * quantity");

            entity.HasCheckConstraint("CK_order_items_shipped_quantity", 
                "shipped_quantity >= 0 AND shipped_quantity <= quantity");

            entity.HasCheckConstraint("CK_order_items_returned_quantity", 
                "returned_quantity >= 0 AND returned_quantity <= shipped_quantity");

            entity.HasCheckConstraint("CK_order_items_refunded_quantity", 
                "refunded_quantity >= 0 AND refunded_quantity <= quantity");

            entity.HasCheckConstraint("CK_order_items_weight_positive", 
                "weight IS NULL OR weight >= 0");

            // Default values
            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            // JSON columns
            entity.Property(e => e.Dimensions)
                .HasColumnType("jsonb");

            entity.Property(e => e.Metadata)
                .HasColumnType("jsonb");

            // Enum conversions
            entity.Property(e => e.FulfillmentStatus)
                .HasConversion<string>();

            // Soft delete filter
            entity.HasQueryFilter(e => !e.IsDeleted);

            // Computed columns
            entity.Property(e => e.TotalPrice)
                .HasComputedColumnSql("unit_price * quantity", stored: true);
        });

        // Configure OrderStatusHistory entity
        modelBuilder.Entity<OrderStatusHistory>(entity =>
        {
            entity.HasIndex(e => e.OrderId)
                .HasDatabaseName("IX_order_status_history_order_id");

            entity.HasIndex(e => e.ChangedAt)
                .HasDatabaseName("IX_order_status_history_changed_at");

            entity.HasIndex(e => new { e.OrderId, e.ChangedAt })
                .HasDatabaseName("IX_order_status_history_order_date");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            entity.Property(e => e.ChangedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Enum conversions
            entity.Property(e => e.FromStatus)
                .HasConversion<string>();

            entity.Property(e => e.ToStatus)
                .HasConversion<string>();

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure OrderPayment entity
        modelBuilder.Entity<OrderPayment>(entity =>
        {
            entity.HasIndex(e => e.OrderId)
                .HasDatabaseName("IX_order_payments_order_id");

            entity.HasIndex(e => e.PaymentMethod)
                .HasDatabaseName("IX_order_payments_method");

            entity.HasIndex(e => e.Status)
                .HasDatabaseName("IX_order_payments_status");

            entity.HasIndex(e => e.TransactionId)
                .HasDatabaseName("IX_order_payments_transaction_id");

            entity.HasCheckConstraint("CK_order_payments_amount_positive", 
                "amount > 0");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            entity.Property(e => e.ProcessedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Enum conversions
            entity.Property(e => e.Status)
                .HasConversion<string>();

            entity.Property(e => e.PaymentMethod)
                .HasConversion<string>();

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure OrderShippingAddress entity
        modelBuilder.Entity<OrderShippingAddress>(entity =>
        {
            entity.HasIndex(e => e.OrderId)
                .IsUnique()
                .HasDatabaseName("IX_order_shipping_addresses_order_id");

            entity.HasCheckConstraint("CK_order_shipping_addresses_country", 
                "LENGTH(country) = 2");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Configure OrderBillingAddress entity
        modelBuilder.Entity<OrderBillingAddress>(entity =>
        {
            entity.HasIndex(e => e.OrderId)
                .IsUnique()
                .HasDatabaseName("IX_order_billing_addresses_order_id");

            entity.HasCheckConstraint("CK_order_billing_addresses_country", 
                "LENGTH(country) = 2");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("gen_random_uuid()");

            entity.HasQueryFilter(e => !e.IsDeleted);
        });

        // Global configurations
        ConfigureGlobalSettings(modelBuilder);
        CreateViews(modelBuilder);
        CreateFunctions(modelBuilder);
    }

    private void ConfigureGlobalSettings(ModelBuilder modelBuilder)
    {
        // Configure all decimal properties
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(decimal) || property.ClrType == typeof(decimal?))
                {
                    if (property.Name.Contains("Rate") || property.Name.Contains("Percentage"))
                    {
                        property.SetColumnType("decimal(5,4)");
                    }
                    else if (property.Name.Contains("Weight"))
                    {
                        property.SetColumnType("decimal(10,3)");
                    }
                    else
                    {
                        property.SetColumnType("decimal(18,2)");
                    }
                }
            }
        }

        // Configure all string properties
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(string) && property.GetMaxLength() == null)
                {
                    property.SetMaxLength(255);
                }
            }
        }
    }

    private void CreateViews(ModelBuilder modelBuilder)
    {
        // Create view for order summary
        modelBuilder.Entity<OrderSummaryView>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("order_summary_view");
        });

        // SQL for the view will be created in migrations
    }

    private void CreateFunctions(ModelBuilder modelBuilder)
    {
        // Database functions will be created in migrations
        modelBuilder.HasDbFunction(typeof(OrderDbContext).GetMethod(nameof(CalculateOrderTotal))!)
            .HasName("calculate_order_total");
    }

    // Database function
    public static decimal CalculateOrderTotal(Guid orderId)
    {
        throw new NotSupportedException("This method is for use in LINQ queries only");
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        UpdateOrderNumbers();
        return await base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        UpdateOrderNumbers();
        return base.SaveChanges();
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is BaseEntity && (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entry in entries)
        {
            var entity = (BaseEntity)entry.Entity;

            if (entry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.UtcNow;
            }

            entity.UpdatedAt = DateTime.UtcNow;
        }
    }

    private void UpdateOrderNumbers()
    {
        var orderEntries = ChangeTracker.Entries<Order>()
            .Where(e => e.State == EntityState.Added && string.IsNullOrEmpty(e.Entity.OrderNumber));

        foreach (var entry in orderEntries)
        {
            entry.Entity.OrderNumber = entry.Entity.GenerateOrderNumber();
        }
    }
}

// View model for order summary
public class OrderSummaryView
{
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public DateTime OrderDate { get; set; }
    public string? TrackingNumber { get; set; }
}
