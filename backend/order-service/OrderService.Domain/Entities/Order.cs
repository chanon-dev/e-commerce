using OrderService.Domain.Common;
using OrderService.Domain.ValueObjects;

namespace OrderService.Domain.Entities;

public class Order : BaseAuditableEntity
{
    public string OrderNumber { get; private set; } = string.Empty;
    public Guid UserId { get; private set; }
    public string CustomerEmail { get; private set; } = string.Empty;
    public string CustomerName { get; private set; } = string.Empty;
    public string CustomerPhone { get; private set; } = string.Empty;
    
    public OrderStatus Status { get; private set; }
    public PaymentStatus PaymentStatus { get; private set; }
    public ShippingStatus ShippingStatus { get; private set; }
    
    public Address BillingAddress { get; private set; } = null!;
    public Address ShippingAddress { get; private set; } = null!;
    
    public Money Subtotal { get; private set; } = null!;
    public Money TaxAmount { get; private set; } = null!;
    public Money ShippingAmount { get; private set; } = null!;
    public Money DiscountAmount { get; private set; } = null!;
    public Money TotalAmount { get; private set; } = null!;
    
    public string Currency { get; private set; } = "USD";
    public int ItemCount { get; private set; }
    
    public string? CouponCode { get; private set; }
    public string? Notes { get; private set; }
    public string? InternalNotes { get; private set; }
    
    public DateTime? ShippedAt { get; private set; }
    public DateTime? DeliveredAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public string? CancellationReason { get; private set; }
    
    public string? TrackingNumber { get; private set; }
    public string? ShippingCarrier { get; private set; }
    public string? ShippingMethod { get; private set; }
    
    public Guid? PaymentIntentId { get; private set; }
    public string? PaymentMethod { get; private set; }
    public DateTime? PaymentDate { get; private set; }
    
    public Dictionary<string, object> Metadata { get; private set; } = new();
    
    // Navigation properties
    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();
    
    private readonly List<OrderStatusHistory> _statusHistory = new();
    public IReadOnlyCollection<OrderStatusHistory> StatusHistory => _statusHistory.AsReadOnly();
    
    private readonly List<OrderPayment> _payments = new();
    public IReadOnlyCollection<OrderPayment> Payments => _payments.AsReadOnly();

    // Constructors
    private Order() { } // For EF Core
    
    public static Order Create(
        Guid userId,
        string customerEmail,
        string customerName,
        string customerPhone,
        Address billingAddress,
        Address shippingAddress,
        string currency = "USD")
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = GenerateOrderNumber(),
            UserId = userId,
            CustomerEmail = customerEmail,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            ShippingStatus = ShippingStatus.NotShipped,
            BillingAddress = billingAddress,
            ShippingAddress = shippingAddress,
            Currency = currency,
            Subtotal = Money.Zero(currency),
            TaxAmount = Money.Zero(currency),
            ShippingAmount = Money.Zero(currency),
            DiscountAmount = Money.Zero(currency),
            TotalAmount = Money.Zero(currency)
        };
        
        order.AddStatusHistory(OrderStatus.Pending, "Order created");
        return order;
    }
    
    // Business methods
    public void AddItem(
        Guid productId,
        string productName,
        string productSku,
        decimal unitPrice,
        int quantity,
        Guid? variantId = null,
        string? variantName = null,
        Dictionary<string, object>? attributes = null)
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Cannot modify confirmed order");
            
        if (quantity <= 0)
            throw new ArgumentException("Quantity must be positive", nameof(quantity));
            
        if (unitPrice < 0)
            throw new ArgumentException("Unit price cannot be negative", nameof(unitPrice));
        
        var existingItem = _items.FirstOrDefault(i => 
            i.ProductId == productId && i.VariantId == variantId);
            
        if (existingItem != null)
        {
            existingItem.UpdateQuantity(existingItem.Quantity + quantity);
        }
        else
        {
            var item = OrderItem.Create(
                Id, productId, productName, productSku, 
                unitPrice, quantity, Currency, variantId, variantName, attributes);
            _items.Add(item);
        }
        
        RecalculateTotals();
    }
    
    public void UpdateItemQuantity(Guid itemId, int quantity)
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Cannot modify confirmed order");
            
        var item = _items.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
            throw new ArgumentException("Order item not found", nameof(itemId));
            
        item.UpdateQuantity(quantity);
        RecalculateTotals();
    }
    
    public void RemoveItem(Guid itemId)
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Cannot modify confirmed order");
            
        var item = _items.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
            throw new ArgumentException("Order item not found", nameof(itemId));
            
        _items.Remove(item);
        RecalculateTotals();
    }
    
    public void ApplyCoupon(string couponCode, decimal discountAmount)
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Cannot modify confirmed order");
            
        if (discountAmount < 0)
            throw new ArgumentException("Discount amount cannot be negative", nameof(discountAmount));
            
        if (discountAmount > Subtotal.Amount)
            throw new ArgumentException("Discount cannot exceed subtotal", nameof(discountAmount));
        
        CouponCode = couponCode;
        DiscountAmount = new Money(discountAmount, Currency);
        RecalculateTotals();
    }
    
    public void RemoveCoupon()
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Cannot modify confirmed order");
            
        CouponCode = null;
        DiscountAmount = Money.Zero(Currency);
        RecalculateTotals();
    }
    
    public void SetShipping(decimal shippingAmount, string? method = null, string? carrier = null)
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Cannot modify confirmed order");
            
        if (shippingAmount < 0)
            throw new ArgumentException("Shipping amount cannot be negative", nameof(shippingAmount));
        
        ShippingAmount = new Money(shippingAmount, Currency);
        ShippingMethod = method;
        ShippingCarrier = carrier;
        RecalculateTotals();
    }
    
    public void SetTax(decimal taxAmount)
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Cannot modify confirmed order");
            
        if (taxAmount < 0)
            throw new ArgumentException("Tax amount cannot be negative", nameof(taxAmount));
        
        TaxAmount = new Money(taxAmount, Currency);
        RecalculateTotals();
    }
    
    public void Confirm()
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Order is not in pending status");
            
        if (!_items.Any())
            throw new InvalidOperationException("Cannot confirm order without items");
        
        Status = OrderStatus.Confirmed;
        AddStatusHistory(OrderStatus.Confirmed, "Order confirmed");
    }
    
    public void StartProcessing()
    {
        if (Status != OrderStatus.Confirmed)
            throw new InvalidOperationException("Order must be confirmed before processing");
        
        Status = OrderStatus.Processing;
        AddStatusHistory(OrderStatus.Processing, "Order processing started");
    }
    
    public void Ship(string trackingNumber, string? carrier = null, DateTime? shippedAt = null)
    {
        if (Status != OrderStatus.Processing)
            throw new InvalidOperationException("Order must be processing before shipping");
            
        if (string.IsNullOrWhiteSpace(trackingNumber))
            throw new ArgumentException("Tracking number is required", nameof(trackingNumber));
        
        Status = OrderStatus.Shipped;
        ShippingStatus = ShippingStatus.Shipped;
        TrackingNumber = trackingNumber;
        ShippingCarrier = carrier ?? ShippingCarrier;
        ShippedAt = shippedAt ?? DateTime.UtcNow;
        
        AddStatusHistory(OrderStatus.Shipped, $"Order shipped with tracking: {trackingNumber}");
    }
    
    public void Deliver(DateTime? deliveredAt = null)
    {
        if (Status != OrderStatus.Shipped)
            throw new InvalidOperationException("Order must be shipped before delivery");
        
        Status = OrderStatus.Delivered;
        ShippingStatus = ShippingStatus.Delivered;
        DeliveredAt = deliveredAt ?? DateTime.UtcNow;
        
        AddStatusHistory(OrderStatus.Delivered, "Order delivered successfully");
    }
    
    public void Cancel(string reason)
    {
        if (Status == OrderStatus.Delivered)
            throw new InvalidOperationException("Cannot cancel delivered order");
            
        if (Status == OrderStatus.Cancelled)
            throw new InvalidOperationException("Order is already cancelled");
        
        Status = OrderStatus.Cancelled;
        CancellationReason = reason;
        CancelledAt = DateTime.UtcNow;
        
        AddStatusHistory(OrderStatus.Cancelled, $"Order cancelled: {reason}");
    }
    
    public void AddPayment(
        decimal amount,
        string paymentMethod,
        string? transactionId = null,
        PaymentStatus status = PaymentStatus.Completed,
        DateTime? paymentDate = null)
    {
        var payment = OrderPayment.Create(
            Id, amount, Currency, paymentMethod, transactionId, status, paymentDate);
        _payments.Add(payment);
        
        UpdatePaymentStatus();
        
        if (PaymentStatus == PaymentStatus.Paid && Status == OrderStatus.Pending)
        {
            Confirm();
        }
    }
    
    public void SetNotes(string notes)
    {
        Notes = notes;
    }
    
    public void SetInternalNotes(string notes)
    {
        InternalNotes = notes;
    }
    
    public void AddMetadata(string key, object value)
    {
        Metadata[key] = value;
    }
    
    // Private methods
    private void RecalculateTotals()
    {
        Subtotal = new Money(_items.Sum(i => i.TotalPrice.Amount), Currency);
        ItemCount = _items.Sum(i => i.Quantity);
        TotalAmount = new Money(
            Subtotal.Amount + TaxAmount.Amount + ShippingAmount.Amount - DiscountAmount.Amount,
            Currency);
    }
    
    private void AddStatusHistory(OrderStatus status, string notes)
    {
        var history = OrderStatusHistory.Create(Id, status, notes);
        _statusHistory.Add(history);
    }
    
    private void UpdatePaymentStatus()
    {
        if (!_payments.Any())
        {
            PaymentStatus = PaymentStatus.Pending;
            return;
        }
        
        var totalPaid = _payments
            .Where(p => p.Status == PaymentStatus.Completed)
            .Sum(p => p.Amount.Amount);
            
        if (totalPaid >= TotalAmount.Amount)
        {
            PaymentStatus = PaymentStatus.Paid;
            PaymentDate = _payments
                .Where(p => p.Status == PaymentStatus.Completed)
                .Max(p => p.PaymentDate);
        }
        else if (totalPaid > 0)
        {
            PaymentStatus = PaymentStatus.PartiallyPaid;
        }
        else
        {
            PaymentStatus = PaymentStatus.Pending;
        }
    }
    
    private static string GenerateOrderNumber()
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var random = new Random().Next(1000, 9999);
        return $"ORD-{timestamp}-{random}";
    }
    
    // Helper properties
    public bool CanBeModified => Status == OrderStatus.Pending;
    public bool CanBeCancelled => Status != OrderStatus.Delivered && Status != OrderStatus.Cancelled;
    public bool IsCompleted => Status == OrderStatus.Delivered;
    public bool IsCancelled => Status == OrderStatus.Cancelled;
    public bool IsPaid => PaymentStatus == PaymentStatus.Paid;
    public bool HasShippingInfo => !string.IsNullOrEmpty(TrackingNumber);
    public decimal TotalPaid => _payments.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount.Amount);
    public decimal RemainingAmount => Math.Max(0, TotalAmount.Amount - TotalPaid);
}

public enum OrderStatus
{
    Pending = 0,
    Confirmed = 1,
    Processing = 2,
    Shipped = 3,
    Delivered = 4,
    Cancelled = 5,
    Returned = 6
}

public enum PaymentStatus
{
    Pending = 0,
    Paid = 1,
    PartiallyPaid = 2,
    Failed = 3,
    Refunded = 4,
    PartiallyRefunded = 5,
    Completed = 6
}

public enum ShippingStatus
{
    NotShipped = 0,
    Shipped = 1,
    InTransit = 2,
    OutForDelivery = 3,
    Delivered = 4,
    Failed = 5,
    Returned = 6
}
