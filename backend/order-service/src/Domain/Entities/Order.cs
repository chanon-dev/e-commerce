using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OrderService.Domain.Entities;

[Table("orders")]
public class Order : BaseEntity
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("order_number")]
    [MaxLength(50)]
    public string OrderNumber { get; set; } = string.Empty;

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("guest_email")]
    [MaxLength(255)]
    [EmailAddress]
    public string? GuestEmail { get; set; }

    [Required]
    [Column("status")]
    [MaxLength(20)]
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    [Column("payment_status")]
    [MaxLength(20)]
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    [Column("fulfillment_status")]
    [MaxLength(20)]
    public FulfillmentStatus FulfillmentStatus { get; set; } = FulfillmentStatus.Unfulfilled;

    [Required]
    [Column("currency")]
    [MaxLength(3)]
    public string Currency { get; set; } = "USD";

    [Required]
    [Column("subtotal")]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }

    [Required]
    [Column("tax_amount")]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; }

    [Required]
    [Column("shipping_amount")]
    [Column(TypeName = "decimal(18,2)")]
    public decimal ShippingAmount { get; set; }

    [Required]
    [Column("discount_amount")]
    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; }

    [Required]
    [Column("total_amount")]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Column("tax_rate")]
    [Column(TypeName = "decimal(5,4)")]
    public decimal TaxRate { get; set; }

    [Column("promotion_code")]
    [MaxLength(50)]
    public string? PromotionCode { get; set; }

    [Column("notes")]
    [MaxLength(1000)]
    public string? Notes { get; set; }

    [Column("internal_notes")]
    [MaxLength(1000)]
    public string? InternalNotes { get; set; }

    [Column("order_date")]
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;

    [Column("shipped_date")]
    public DateTime? ShippedDate { get; set; }

    [Column("delivered_date")]
    public DateTime? DeliveredDate { get; set; }

    [Column("cancelled_date")]
    public DateTime? CancelledDate { get; set; }

    [Column("cancellation_reason")]
    [MaxLength(500)]
    public string? CancellationReason { get; set; }

    [Column("refund_amount")]
    [Column(TypeName = "decimal(18,2)")]
    public decimal RefundAmount { get; set; }

    [Column("refund_reason")]
    [MaxLength(500)]
    public string? RefundReason { get; set; }

    [Column("tracking_number")]
    [MaxLength(100)]
    public string? TrackingNumber { get; set; }

    [Column("shipping_carrier")]
    [MaxLength(50)]
    public string? ShippingCarrier { get; set; }

    [Column("shipping_method")]
    [MaxLength(50)]
    public string? ShippingMethod { get; set; }

    [Column("estimated_delivery_date")]
    public DateTime? EstimatedDeliveryDate { get; set; }

    [Column("metadata")]
    [Column(TypeName = "jsonb")]
    public string? Metadata { get; set; }

    // Navigation Properties
    public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public virtual ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
    public virtual ICollection<OrderPayment> Payments { get; set; } = new List<OrderPayment>();
    public virtual OrderShippingAddress? ShippingAddress { get; set; }
    public virtual OrderBillingAddress? BillingAddress { get; set; }

    // Computed Properties
    [NotMapped]
    public int ItemCount => Items?.Sum(i => i.Quantity) ?? 0;

    [NotMapped]
    public decimal ItemsTotal => Items?.Sum(i => i.TotalPrice) ?? 0;

    [NotMapped]
    public bool IsGuest => !string.IsNullOrEmpty(GuestEmail);

    [NotMapped]
    public bool CanBeCancelled => Status == OrderStatus.Pending || Status == OrderStatus.Confirmed;

    [NotMapped]
    public bool CanBeRefunded => PaymentStatus == PaymentStatus.Paid && Status != OrderStatus.Cancelled;

    [NotMapped]
    public bool IsCompleted => Status == OrderStatus.Delivered;

    [NotMapped]
    public TimeSpan ProcessingTime => 
        (ShippedDate ?? DateTime.UtcNow) - OrderDate;

    // Methods
    public void UpdateStatus(OrderStatus newStatus, string? reason = null, string? updatedBy = null)
    {
        var oldStatus = Status;
        Status = newStatus;

        // Add to status history
        StatusHistory.Add(new OrderStatusHistory
        {
            OrderId = Id,
            FromStatus = oldStatus,
            ToStatus = newStatus,
            Reason = reason,
            ChangedBy = updatedBy,
            ChangedAt = DateTime.UtcNow
        });

        // Update related dates
        switch (newStatus)
        {
            case OrderStatus.Shipped:
                ShippedDate = DateTime.UtcNow;
                FulfillmentStatus = FulfillmentStatus.Shipped;
                break;
            case OrderStatus.Delivered:
                DeliveredDate = DateTime.UtcNow;
                FulfillmentStatus = FulfillmentStatus.Fulfilled;
                break;
            case OrderStatus.Cancelled:
                CancelledDate = DateTime.UtcNow;
                CancellationReason = reason;
                break;
        }

        UpdateTimestamp(updatedBy);
    }

    public void AddItem(Guid productId, string productName, string? productSku, 
                       decimal unitPrice, int quantity, string? variantId = null)
    {
        var existingItem = Items.FirstOrDefault(i => 
            i.ProductId == productId && i.VariantId == variantId);

        if (existingItem != null)
        {
            existingItem.UpdateQuantity(existingItem.Quantity + quantity);
        }
        else
        {
            Items.Add(new OrderItem
            {
                OrderId = Id,
                ProductId = productId,
                ProductName = productName,
                ProductSku = productSku,
                VariantId = variantId,
                UnitPrice = unitPrice,
                Quantity = quantity
            });
        }

        RecalculateTotals();
    }

    public void RemoveItem(Guid orderItemId)
    {
        var item = Items.FirstOrDefault(i => i.Id == orderItemId);
        if (item != null)
        {
            Items.Remove(item);
            RecalculateTotals();
        }
    }

    public void UpdateItemQuantity(Guid orderItemId, int newQuantity)
    {
        var item = Items.FirstOrDefault(i => i.Id == orderItemId);
        if (item != null)
        {
            if (newQuantity <= 0)
            {
                RemoveItem(orderItemId);
            }
            else
            {
                item.UpdateQuantity(newQuantity);
                RecalculateTotals();
            }
        }
    }

    public void ApplyDiscount(decimal discountAmount, string? promotionCode = null)
    {
        DiscountAmount = discountAmount;
        PromotionCode = promotionCode;
        RecalculateTotals();
    }

    public void SetShipping(decimal shippingAmount, string? carrier = null, string? method = null)
    {
        ShippingAmount = shippingAmount;
        ShippingCarrier = carrier;
        ShippingMethod = method;
        RecalculateTotals();
    }

    public void SetTax(decimal taxRate, decimal taxAmount)
    {
        TaxRate = taxRate;
        TaxAmount = taxAmount;
        RecalculateTotals();
    }

    public void RecalculateTotals()
    {
        Subtotal = Items.Sum(i => i.TotalPrice);
        TotalAmount = Subtotal + TaxAmount + ShippingAmount - DiscountAmount;
        
        // Ensure total is not negative
        if (TotalAmount < 0)
        {
            TotalAmount = 0;
        }
    }

    public void Cancel(string reason, string? cancelledBy = null)
    {
        if (!CanBeCancelled)
        {
            throw new InvalidOperationException("Order cannot be cancelled in current status");
        }

        UpdateStatus(OrderStatus.Cancelled, reason, cancelledBy);
    }

    public void ProcessRefund(decimal refundAmount, string reason, string? processedBy = null)
    {
        if (!CanBeRefunded)
        {
            throw new InvalidOperationException("Order cannot be refunded");
        }

        RefundAmount += refundAmount;
        RefundReason = reason;
        
        if (RefundAmount >= TotalAmount)
        {
            PaymentStatus = PaymentStatus.Refunded;
        }
        else
        {
            PaymentStatus = PaymentStatus.PartiallyRefunded;
        }

        UpdateTimestamp(processedBy);
    }

    public void SetTrackingInfo(string trackingNumber, string carrier, DateTime? estimatedDelivery = null)
    {
        TrackingNumber = trackingNumber;
        ShippingCarrier = carrier;
        EstimatedDeliveryDate = estimatedDelivery;
        
        if (Status == OrderStatus.Confirmed)
        {
            UpdateStatus(OrderStatus.Shipped);
        }
    }

    public string GenerateOrderNumber()
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd");
        var random = new Random().Next(1000, 9999);
        return $"ORD-{timestamp}-{random}";
    }
}

public enum OrderStatus
{
    Pending,
    Confirmed,
    Processing,
    Shipped,
    Delivered,
    Cancelled,
    Returned,
    Refunded
}

public enum PaymentStatus
{
    Pending,
    Paid,
    Failed,
    Cancelled,
    Refunded,
    PartiallyRefunded,
    Authorized,
    Captured
}

public enum FulfillmentStatus
{
    Unfulfilled,
    PartiallyFulfilled,
    Fulfilled,
    Shipped,
    Delivered,
    Returned
}
