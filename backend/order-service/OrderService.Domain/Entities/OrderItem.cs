using OrderService.Domain.Common;
using OrderService.Domain.ValueObjects;

namespace OrderService.Domain.Entities;

public class OrderItem : BaseAuditableEntity
{
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    public string ProductSku { get; private set; } = string.Empty;
    public Guid? VariantId { get; private set; }
    public string? VariantName { get; private set; }
    public string? ProductImageUrl { get; private set; }
    
    public Money UnitPrice { get; private set; } = null!;
    public int Quantity { get; private set; }
    public Money TotalPrice { get; private set; } = null!;
    
    public Dictionary<string, object> ProductAttributes { get; private set; } = new();
    public Dictionary<string, object> VariantAttributes { get; private set; } = new();
    public Dictionary<string, object> Customizations { get; private set; } = new();
    
    public string? Notes { get; private set; }
    
    // Navigation properties
    public Order Order { get; private set; } = null!;

    // Constructors
    private OrderItem() { } // For EF Core
    
    public static OrderItem Create(
        Guid orderId,
        Guid productId,
        string productName,
        string productSku,
        decimal unitPrice,
        int quantity,
        string currency,
        Guid? variantId = null,
        string? variantName = null,
        Dictionary<string, object>? attributes = null)
    {
        if (quantity <= 0)
            throw new ArgumentException("Quantity must be positive", nameof(quantity));
            
        if (unitPrice < 0)
            throw new ArgumentException("Unit price cannot be negative", nameof(unitPrice));
            
        if (string.IsNullOrWhiteSpace(productName))
            throw new ArgumentException("Product name is required", nameof(productName));
            
        if (string.IsNullOrWhiteSpace(productSku))
            throw new ArgumentException("Product SKU is required", nameof(productSku));
        
        var item = new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            ProductId = productId,
            ProductName = productName,
            ProductSku = productSku,
            VariantId = variantId,
            VariantName = variantName,
            UnitPrice = new Money(unitPrice, currency),
            Quantity = quantity,
            ProductAttributes = attributes ?? new Dictionary<string, object>()
        };
        
        item.CalculateTotalPrice();
        return item;
    }
    
    // Business methods
    public void UpdateQuantity(int newQuantity)
    {
        if (newQuantity <= 0)
            throw new ArgumentException("Quantity must be positive", nameof(newQuantity));
            
        if (newQuantity > 999)
            throw new ArgumentException("Quantity cannot exceed 999", nameof(newQuantity));
        
        Quantity = newQuantity;
        CalculateTotalPrice();
    }
    
    public void UpdateUnitPrice(decimal newUnitPrice)
    {
        if (newUnitPrice < 0)
            throw new ArgumentException("Unit price cannot be negative", nameof(newUnitPrice));
        
        UnitPrice = new Money(newUnitPrice, UnitPrice.Currency);
        CalculateTotalPrice();
    }
    
    public void SetProductImageUrl(string imageUrl)
    {
        ProductImageUrl = imageUrl;
    }
    
    public void AddProductAttribute(string key, object value)
    {
        ProductAttributes[key] = value;
    }
    
    public void AddVariantAttribute(string key, object value)
    {
        VariantAttributes[key] = value;
    }
    
    public void AddCustomization(string key, object value)
    {
        Customizations[key] = value;
    }
    
    public void SetNotes(string notes)
    {
        Notes = notes;
    }
    
    public T? GetProductAttribute<T>(string key)
    {
        return ProductAttributes.TryGetValue(key, out var value) ? (T?)value : default;
    }
    
    public T? GetVariantAttribute<T>(string key)
    {
        return VariantAttributes.TryGetValue(key, out var value) ? (T?)value : default;
    }
    
    public T? GetCustomization<T>(string key)
    {
        return Customizations.TryGetValue(key, out var value) ? (T?)value : default;
    }
    
    // Private methods
    private void CalculateTotalPrice()
    {
        TotalPrice = new Money(UnitPrice.Amount * Quantity, UnitPrice.Currency);
    }
    
    // Helper properties
    public string DisplayName => VariantName != null ? $"{ProductName} - {VariantName}" : ProductName;
    public bool HasVariant => VariantId.HasValue;
    public bool HasCustomizations => Customizations.Any();
    public bool HasNotes => !string.IsNullOrWhiteSpace(Notes);
    public bool IsHighQuantity => Quantity >= 10;
    public bool IsHighValue => TotalPrice.Amount >= 100;
    public string? Color => GetVariantAttribute<string>("color");
    public string? Size => GetVariantAttribute<string>("size");
    public string? Brand => GetProductAttribute<string>("brand");
    public string? Category => GetProductAttribute<string>("category");
    public decimal Weight => GetProductAttribute<decimal>("weight");
}
