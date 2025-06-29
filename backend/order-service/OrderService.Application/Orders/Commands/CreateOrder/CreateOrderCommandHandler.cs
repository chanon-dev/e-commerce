using MediatR;
using OrderService.Application.Common.Interfaces;
using OrderService.Application.Orders.DTOs;
using OrderService.Domain.Entities;
using OrderService.Domain.ValueObjects;

namespace OrderService.Application.Orders.Commands.CreateOrder;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeService _dateTimeService;

    public CreateOrderCommandHandler(
        IOrderRepository orderRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUserService,
        IDateTimeService dateTimeService)
    {
        _orderRepository = orderRepository;
        _unitOfWork = unitOfWork;
        _currentUserService = currentUserService;
        _dateTimeService = dateTimeService;
    }

    public async Task<OrderDto> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        // Create billing address
        var billingAddress = new Address(
            request.BillingAddress.Street,
            request.BillingAddress.City,
            request.BillingAddress.State,
            request.BillingAddress.PostalCode,
            request.BillingAddress.Country,
            request.BillingAddress.Street2,
            request.BillingAddress.Company,
            request.BillingAddress.Instructions);

        // Create shipping address
        var shippingAddress = new Address(
            request.ShippingAddress.Street,
            request.ShippingAddress.City,
            request.ShippingAddress.State,
            request.ShippingAddress.PostalCode,
            request.ShippingAddress.Country,
            request.ShippingAddress.Street2,
            request.ShippingAddress.Company,
            request.ShippingAddress.Instructions);

        // Create order
        var order = Order.Create(
            request.UserId,
            request.CustomerEmail,
            request.CustomerName,
            request.CustomerPhone,
            billingAddress,
            shippingAddress,
            request.Currency);

        // Add items
        foreach (var itemDto in request.Items)
        {
            order.AddItem(
                itemDto.ProductId,
                itemDto.ProductName,
                itemDto.ProductSku,
                itemDto.UnitPrice,
                itemDto.Quantity,
                itemDto.VariantId,
                itemDto.VariantName,
                itemDto.ProductAttributes);
        }

        // Apply coupon if provided
        if (!string.IsNullOrEmpty(request.CouponCode) && request.DiscountAmount.HasValue)
        {
            order.ApplyCoupon(request.CouponCode, request.DiscountAmount.Value);
        }

        // Set shipping if provided
        if (request.ShippingAmount.HasValue)
        {
            order.SetShipping(request.ShippingAmount.Value, request.ShippingMethod, request.ShippingCarrier);
        }

        // Set tax if provided
        if (request.TaxAmount.HasValue)
        {
            order.SetTax(request.TaxAmount.Value);
        }

        // Set notes if provided
        if (!string.IsNullOrEmpty(request.Notes))
        {
            order.SetNotes(request.Notes);
        }

        // Add metadata if provided
        if (request.Metadata != null)
        {
            foreach (var kvp in request.Metadata)
            {
                order.AddMetadata(kvp.Key, kvp.Value);
            }
        }

        // Save order
        await _orderRepository.AddAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Return DTO
        return OrderDto.FromEntity(order);
    }
}
