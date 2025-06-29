using OrderService.Domain.Entities;

namespace OrderService.Application.Orders.DTOs;

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    
    public string Status { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string ShippingStatus { get; set; } = string.Empty;
    
    public AddressDto BillingAddress { get; set; } = null!;
    public AddressDto ShippingAddress { get; set; } = null!;
    
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal ShippingAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = string.Empty;
    
    public int ItemCount { get; set; }
    public string? CouponCode { get; set; }
    public string? Notes { get; set; }
    public string? InternalNotes { get; set; }
    
    public DateTime? ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    
    public string? TrackingNumber { get; set; }
    public string? ShippingCarrier { get; set; }
    public string? ShippingMethod { get; set; }
    
    public string? PaymentMethod { get; set; }
    public DateTime? PaymentDate { get; set; }
    
    public List<OrderItemDto> Items { get; set; } = new();
    public List<OrderStatusHistoryDto> StatusHistory { get; set; } = new();
    public List<OrderPaymentDto> Payments { get; set; } = new();
    
    public Dictionary<string, object> Metadata { get; set; } = new();
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Helper properties
    public bool CanBeModified { get; set; }
    public bool CanBeCancelled { get; set; }
    public bool IsCompleted { get; set; }
    public bool IsCancelled { get; set; }
    public bool IsPaid { get; set; }
    public bool HasShippingInfo { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal RemainingAmount { get; set; }
    public string FormattedTotal { get; set; } = string.Empty;
    public string FormattedSubtotal { get; set; } = string.Empty;

    public static OrderDto FromEntity(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            UserId = order.UserId,
            CustomerEmail = order.CustomerEmail,
            CustomerName = order.CustomerName,
            CustomerPhone = order.CustomerPhone,
            Status = order.Status.ToString(),
            PaymentStatus = order.PaymentStatus.ToString(),
            ShippingStatus = order.ShippingStatus.ToString(),
            BillingAddress = AddressDto.FromValueObject(order.BillingAddress),
            ShippingAddress = AddressDto.FromValueObject(order.ShippingAddress),
            Subtotal = order.Subtotal.Amount,
            TaxAmount = order.TaxAmount.Amount,
            ShippingAmount = order.ShippingAmount.Amount,
            DiscountAmount = order.DiscountAmount.Amount,
            TotalAmount = order.TotalAmount.Amount,
            Currency = order.Currency,
            ItemCount = order.ItemCount,
            CouponCode = order.CouponCode,
            Notes = order.Notes,
            InternalNotes = order.InternalNotes,
            ShippedAt = order.ShippedAt,
            DeliveredAt = order.DeliveredAt,
            CancelledAt = order.CancelledAt,
            CancellationReason = order.CancellationReason,
            TrackingNumber = order.TrackingNumber,
            ShippingCarrier = order.ShippingCarrier,
            ShippingMethod = order.ShippingMethod,
            PaymentMethod = order.PaymentMethod,
            PaymentDate = order.PaymentDate,
            Items = order.Items.Select(OrderItemDto.FromEntity).ToList(),
            StatusHistory = order.StatusHistory.Select(OrderStatusHistoryDto.FromEntity).ToList(),
            Payments = order.Payments.Select(OrderPaymentDto.FromEntity).ToList(),
            Metadata = order.Metadata,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            CanBeModified = order.CanBeModified,
            CanBeCancelled = order.CanBeCancelled,
            IsCompleted = order.IsCompleted,
            IsCancelled = order.IsCancelled,
            IsPaid = order.IsPaid,
            HasShippingInfo = order.HasShippingInfo,
            TotalPaid = order.TotalPaid,
            RemainingAmount = order.RemainingAmount,
            FormattedTotal = order.TotalAmount.FormattedAmount,
            FormattedSubtotal = order.Subtotal.FormattedAmount
        };
    }
}

public class OrderItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public Guid? VariantId { get; set; }
    public string? VariantName { get; set; }
    public string? ProductImageUrl { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
    public Dictionary<string, object> ProductAttributes { get; set; } = new();
    public Dictionary<string, object> VariantAttributes { get; set; } = new();
    public Dictionary<string, object> Customizations { get; set; } = new();
    public string? Notes { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public bool HasVariant { get; set; }
    public bool HasCustomizations { get; set; }
    public string FormattedPrice { get; set; } = string.Empty;

    public static OrderItemDto FromEntity(OrderItem item)
    {
        return new OrderItemDto
        {
            Id = item.Id,
            ProductId = item.ProductId,
            ProductName = item.ProductName,
            ProductSku = item.ProductSku,
            VariantId = item.VariantId,
            VariantName = item.VariantName,
            ProductImageUrl = item.ProductImageUrl,
            UnitPrice = item.UnitPrice.Amount,
            Quantity = item.Quantity,
            TotalPrice = item.TotalPrice.Amount,
            ProductAttributes = item.ProductAttributes,
            VariantAttributes = item.VariantAttributes,
            Customizations = item.Customizations,
            Notes = item.Notes,
            DisplayName = item.DisplayName,
            HasVariant = item.HasVariant,
            HasCustomizations = item.HasCustomizations,
            FormattedPrice = item.TotalPrice.FormattedAmount
        };
    }
}

public class OrderStatusHistoryDto
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? PreviousStatus { get; set; }
    public string Notes { get; set; } = string.Empty;
    public string? ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();

    public static OrderStatusHistoryDto FromEntity(OrderStatusHistory history)
    {
        return new OrderStatusHistoryDto
        {
            Id = history.Id,
            Status = history.Status.ToString(),
            PreviousStatus = history.PreviousStatus?.ToString(),
            Notes = history.Notes,
            ChangedBy = history.ChangedBy,
            ChangedAt = history.ChangedAt,
            Metadata = history.Metadata
        };
    }
}

public class OrderPaymentDto
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public string? PaymentIntentId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? FailureReason { get; set; }
    public Dictionary<string, object> PaymentDetails { get; set; } = new();
    public string FormattedAmount { get; set; } = string.Empty;

    public static OrderPaymentDto FromEntity(OrderPayment payment)
    {
        return new OrderPaymentDto
        {
            Id = payment.Id,
            Amount = payment.Amount.Amount,
            Currency = payment.Amount.Currency,
            PaymentMethod = payment.PaymentMethod,
            TransactionId = payment.TransactionId,
            PaymentIntentId = payment.PaymentIntentId,
            Status = payment.Status.ToString(),
            PaymentDate = payment.PaymentDate,
            ProcessedAt = payment.ProcessedAt,
            FailureReason = payment.FailureReason,
            PaymentDetails = payment.PaymentDetails,
            FormattedAmount = payment.FormattedAmount
        };
    }
}

public class AddressDto
{
    public string Street { get; set; } = string.Empty;
    public string? Street2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? Company { get; set; }
    public string? Instructions { get; set; }

    public static AddressDto FromValueObject(Domain.ValueObjects.Address address)
    {
        return new AddressDto
        {
            Street = address.Street,
            Street2 = address.Street2,
            City = address.City,
            State = address.State,
            PostalCode = address.PostalCode,
            Country = address.Country,
            Company = address.Company,
            Instructions = address.Instructions
        };
    }
}
