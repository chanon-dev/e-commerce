using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace OrderService.Models;

public class Order
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string OrderNumber { get; set; } = string.Empty;

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    public FulfillmentStatus FulfillmentStatus { get; set; } = FulfillmentStatus.Unfulfilled;

    [Required]
    public List<OrderItem> Items { get; set; } = new();

    [Required]
    public Address ShippingAddress { get; set; } = new();

    public Address? BillingAddress { get; set; }

    [Required]
    public OrderTotals Totals { get; set; } = new();

    public PaymentDetails? PaymentDetails { get; set; }

    public ShippingDetails? ShippingDetails { get; set; }

    public List<OrderNote> Notes { get; set; } = new();

    public List<OrderEvent> Events { get; set; } = new();

    public CouponDetails? AppliedCoupon { get; set; }

    [MaxLength(500)]
    public string? CustomerNotes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    public DateTime? CancelledAt { get; set; }

    [MaxLength(500)]
    public string? CancellationReason { get; set; }

    // Computed properties
    [BsonIgnore]
    public int TotalItems => Items.Sum(i => i.Quantity);

    [BsonIgnore]
    public bool IsCompleted => Status == OrderStatus.Completed;

    [BsonIgnore]
    public bool IsCancelled => Status == OrderStatus.Cancelled;

    [BsonIgnore]
    public bool CanBeCancelled => Status is OrderStatus.Pending or OrderStatus.Confirmed && PaymentStatus != PaymentStatus.Paid;
}

public class OrderItem
{
    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [MaxLength(255)]
    public string ProductName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ProductSku { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? DiscountAmount { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }

    public string? ProductImage { get; set; }

    public Dictionary<string, object>? ProductVariant { get; set; }

    // Computed properties
    [BsonIgnore]
    public decimal SubTotal => UnitPrice * Quantity;

    [BsonIgnore]
    public decimal FinalPrice => SubTotal - (DiscountAmount ?? 0);
}

public class Address
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Company { get; set; }

    [Required]
    [MaxLength(255)]
    public string AddressLine1 { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? AddressLine2 { get; set; }

    [Required]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string State { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string PostalCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Country { get; set; } = string.Empty;

    [Phone]
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    // Computed properties
    [BsonIgnore]
    public string FullName => $"{FirstName} {LastName}";

    [BsonIgnore]
    public string FormattedAddress => $"{AddressLine1}, {City}, {State} {PostalCode}, {Country}";
}

public class OrderTotals
{
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal SubTotal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal ShippingAmount { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; } = 0;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Total { get; set; }

    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = "USD";

    public decimal TaxRate { get; set; } = 0;
}

public class PaymentDetails
{
    [Required]
    [MaxLength(50)]
    public string Method { get; set; } = string.Empty; // credit_card, paypal, bank_transfer, etc.

    [MaxLength(100)]
    public string? TransactionId { get; set; }

    [MaxLength(100)]
    public string? PaymentGateway { get; set; }

    public DateTime? PaidAt { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? RefundedAmount { get; set; }

    public DateTime? RefundedAt { get; set; }

    [MaxLength(500)]
    public string? PaymentNotes { get; set; }

    public Dictionary<string, object>? GatewayResponse { get; set; }
}

public class ShippingDetails
{
    [Required]
    [MaxLength(100)]
    public string Method { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Carrier { get; set; }

    [MaxLength(100)]
    public string? TrackingNumber { get; set; }

    [MaxLength(500)]
    public string? TrackingUrl { get; set; }

    public DateTime? ShippedAt { get; set; }

    public DateTime? DeliveredAt { get; set; }

    public DateTime? EstimatedDeliveryDate { get; set; }

    [MaxLength(500)]
    public string? ShippingNotes { get; set; }
}

public class OrderNote
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    public bool IsCustomerVisible { get; set; } = false;

    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class OrderEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string EventType { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public Dictionary<string, object>? Metadata { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class CouponDetails
{
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public CouponType Type { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Value { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; }
}

public enum OrderStatus
{
    Pending = 1,
    Confirmed = 2,
    Processing = 3,
    Shipped = 4,
    Delivered = 5,
    Completed = 6,
    Cancelled = 7,
    Refunded = 8
}

public enum PaymentStatus
{
    Pending = 1,
    Paid = 2,
    Failed = 3,
    Refunded = 4,
    PartiallyRefunded = 5
}

public enum FulfillmentStatus
{
    Unfulfilled = 1,
    PartiallyFulfilled = 2,
    Fulfilled = 3,
    Shipped = 4,
    Delivered = 5
}

public enum CouponType
{
    Percentage = 1,
    FixedAmount = 2,
    FreeShipping = 3
}
