using OrderService.Domain.Common;

namespace OrderService.Domain.Entities;

public class OrderStatusHistory : BaseAuditableEntity
{
    public Guid OrderId { get; private set; }
    public OrderStatus Status { get; private set; }
    public OrderStatus? PreviousStatus { get; private set; }
    public string Notes { get; private set; } = string.Empty;
    public string? ChangedBy { get; private set; }
    public DateTime ChangedAt { get; private set; }
    public Dictionary<string, object> Metadata { get; private set; } = new();
    
    // Navigation properties
    public Order Order { get; private set; } = null!;

    // Constructors
    private OrderStatusHistory() { } // For EF Core
    
    public static OrderStatusHistory Create(
        Guid orderId,
        OrderStatus status,
        string notes,
        OrderStatus? previousStatus = null,
        string? changedBy = null)
    {
        return new OrderStatusHistory
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Status = status,
            PreviousStatus = previousStatus,
            Notes = notes ?? string.Empty,
            ChangedBy = changedBy,
            ChangedAt = DateTime.UtcNow
        };
    }
    
    // Business methods
    public void AddMetadata(string key, object value)
    {
        Metadata[key] = value;
    }
    
    public T? GetMetadata<T>(string key)
    {
        return Metadata.TryGetValue(key, out var value) ? (T?)value : default;
    }
    
    // Helper properties
    public string StatusDisplayName => Status.ToString();
    public string PreviousStatusDisplayName => PreviousStatus?.ToString() ?? "None";
    public bool HasPreviousStatus => PreviousStatus.HasValue;
    public bool HasChangedBy => !string.IsNullOrWhiteSpace(ChangedBy);
    public bool HasNotes => !string.IsNullOrWhiteSpace(Notes);
    public TimeSpan TimeSinceChange => DateTime.UtcNow - ChangedAt;
    public bool IsRecent => TimeSinceChange.TotalHours < 24;
}
