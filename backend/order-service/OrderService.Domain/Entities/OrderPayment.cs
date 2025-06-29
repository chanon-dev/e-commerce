using OrderService.Domain.Common;
using OrderService.Domain.ValueObjects;

namespace OrderService.Domain.Entities;

public class OrderPayment : BaseAuditableEntity
{
    public Guid OrderId { get; private set; }
    public Money Amount { get; private set; } = null!;
    public string PaymentMethod { get; private set; } = string.Empty;
    public string? TransactionId { get; private set; }
    public string? PaymentIntentId { get; private set; }
    public PaymentStatus Status { get; private set; }
    public DateTime PaymentDate { get; private set; }
    public DateTime? ProcessedAt { get; private set; }
    public string? FailureReason { get; private set; }
    public Dictionary<string, object> PaymentDetails { get; private set; } = new();
    public Dictionary<string, object> Metadata { get; private set; } = new();
    
    // Navigation properties
    public Order Order { get; private set; } = null!;

    // Constructors
    private OrderPayment() { } // For EF Core
    
    public static OrderPayment Create(
        Guid orderId,
        decimal amount,
        string currency,
        string paymentMethod,
        string? transactionId = null,
        PaymentStatus status = PaymentStatus.Pending,
        DateTime? paymentDate = null)
    {
        if (amount <= 0)
            throw new ArgumentException("Payment amount must be positive", nameof(amount));
            
        if (string.IsNullOrWhiteSpace(paymentMethod))
            throw new ArgumentException("Payment method is required", nameof(paymentMethod));
        
        return new OrderPayment
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Amount = new Money(amount, currency),
            PaymentMethod = paymentMethod,
            TransactionId = transactionId,
            Status = status,
            PaymentDate = paymentDate ?? DateTime.UtcNow
        };
    }
    
    // Business methods
    public void MarkAsCompleted(string? transactionId = null, DateTime? processedAt = null)
    {
        if (Status == PaymentStatus.Completed)
            throw new InvalidOperationException("Payment is already completed");
            
        if (Status == PaymentStatus.Failed)
            throw new InvalidOperationException("Cannot complete failed payment");
        
        Status = PaymentStatus.Completed;
        TransactionId = transactionId ?? TransactionId;
        ProcessedAt = processedAt ?? DateTime.UtcNow;
        FailureReason = null;
    }
    
    public void MarkAsFailed(string failureReason, DateTime? processedAt = null)
    {
        if (Status == PaymentStatus.Completed)
            throw new InvalidOperationException("Cannot fail completed payment");
        
        Status = PaymentStatus.Failed;
        FailureReason = failureReason;
        ProcessedAt = processedAt ?? DateTime.UtcNow;
    }
    
    public void MarkAsRefunded(decimal? refundAmount = null, DateTime? processedAt = null)
    {
        if (Status != PaymentStatus.Completed)
            throw new InvalidOperationException("Can only refund completed payments");
        
        var actualRefundAmount = refundAmount ?? Amount.Amount;
        
        if (actualRefundAmount > Amount.Amount)
            throw new ArgumentException("Refund amount cannot exceed payment amount");
        
        Status = actualRefundAmount >= Amount.Amount 
            ? PaymentStatus.Refunded 
            : PaymentStatus.PartiallyRefunded;
            
        ProcessedAt = processedAt ?? DateTime.UtcNow;
        
        AddPaymentDetail("refund_amount", actualRefundAmount);
        AddPaymentDetail("refund_date", ProcessedAt);
    }
    
    public void SetPaymentIntentId(string paymentIntentId)
    {
        PaymentIntentId = paymentIntentId;
    }
    
    public void AddPaymentDetail(string key, object value)
    {
        PaymentDetails[key] = value;
    }
    
    public void AddMetadata(string key, object value)
    {
        Metadata[key] = value;
    }
    
    public T? GetPaymentDetail<T>(string key)
    {
        return PaymentDetails.TryGetValue(key, out var value) ? (T?)value : default;
    }
    
    public T? GetMetadata<T>(string key)
    {
        return Metadata.TryGetValue(key, out var value) ? (T?)value : default;
    }
    
    // Helper properties
    public bool IsCompleted => Status == PaymentStatus.Completed;
    public bool IsFailed => Status == PaymentStatus.Failed;
    public bool IsRefunded => Status == PaymentStatus.Refunded || Status == PaymentStatus.PartiallyRefunded;
    public bool IsPending => Status == PaymentStatus.Pending;
    public bool HasTransactionId => !string.IsNullOrWhiteSpace(TransactionId);
    public bool HasPaymentIntentId => !string.IsNullOrWhiteSpace(PaymentIntentId);
    public bool IsProcessed => ProcessedAt.HasValue;
    public TimeSpan? ProcessingTime => ProcessedAt.HasValue ? ProcessedAt.Value - PaymentDate : null;
    public decimal RefundAmount => GetPaymentDetail<decimal>("refund_amount");
    public DateTime? RefundDate => GetPaymentDetail<DateTime?>("refund_date");
    public string StatusDisplayName => Status.ToString();
    public string FormattedAmount => $"{Amount.Currency} {Amount.Amount:F2}";
}
