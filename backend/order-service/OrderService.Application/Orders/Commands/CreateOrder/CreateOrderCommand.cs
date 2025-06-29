using MediatR;
using OrderService.Application.Orders.DTOs;

namespace OrderService.Application.Orders.Commands.CreateOrder;

public record CreateOrderCommand : IRequest<OrderDto>
{
    public Guid UserId { get; init; }
    public string CustomerEmail { get; init; } = string.Empty;
    public string CustomerName { get; init; } = string.Empty;
    public string CustomerPhone { get; init; } = string.Empty;
    public AddressDto BillingAddress { get; init; } = null!;
    public AddressDto ShippingAddress { get; init; } = null!;
    public List<OrderItemDto> Items { get; init; } = new();
    public string Currency { get; init; } = "USD";
    public string? Notes { get; init; }
    public string? CouponCode { get; init; }
    public decimal? DiscountAmount { get; init; }
    public decimal? ShippingAmount { get; init; }
    public decimal? TaxAmount { get; init; }
    public string? ShippingMethod { get; init; }
    public string? ShippingCarrier { get; init; }
    public Dictionary<string, object>? Metadata { get; init; }
}
