using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OrderService.Domain.Entities;

[Table("order_items")]
public class OrderItem : BaseEntity
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("order_id")]
    public Guid OrderId { get; set; }

    [Required]
    [Column("product_id")]
    public Guid ProductId { get; set; }

    [Column("variant_id")]
    public Guid? VariantId { get; set; }

    [Required]
    [Column("product_name")]
    [MaxLength(255)]
    public string ProductName { get; set; } = string.Empty;

    [Column("product_sku")]
    [MaxLength(100)]
    public string? ProductSku { get; set; }

    [Column("variant_name")]
    [MaxLength(255)]
    public string? VariantName { get; set; }

    [Column("variant_sku")]
    [MaxLength(100)]
    public string? VariantSku { get; set; }

    [Required]
    [Column("unit_price")]
    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [Required]
    [Column("quantity")]
    public int Quantity { get; set; }

    [Required]
    [Column("total_price")]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }

    [Column("discount_amount")]
    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; }

    [Column("tax_amount")]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; }

    [Column("weight")]
    [Column(TypeName = "decimal(10,3)")]
    public decimal? Weight { get; set; }

    [Column("weight_unit")]
    [MaxLength(10)]
    public string? WeightUnit { get; set; } = "kg";

    [Column("dimensions")]
    [Column(TypeName = "jsonb")]
    public string? Dimensions { get; set; }

    [Column("product_image_url")]
    [MaxLength(500)]
    public string? ProductImageUrl { get; set; }

    [Column("product_url")]
    [MaxLength(500)]
    public string? ProductUrl { get; set; }

    [Column("fulfillment_status")]
    [MaxLength(20)]
    public ItemFulfillmentStatus FulfillmentStatus { get; set; } = ItemFulfillmentStatus.Pending;

    [Column("shipped_quantity")]
    public int ShippedQuantity { get; set; }

    [Column("returned_quantity")]
    public int ReturnedQuantity { get; set; }

    [Column("refunded_quantity")]
    public int RefundedQuantity { get; set; }

    [Column("notes")]
    [MaxLength(500)]
    public string? Notes { get; set; }

    [Column("metadata")]
    [Column(TypeName = "jsonb")]
    public string? Metadata { get; set; }

    // Navigation Properties
    [ForeignKey("OrderId")]
    public virtual Order Order { get; set; } = null!;

    // Computed Properties
    [NotMapped]
    public decimal NetPrice => TotalPrice - DiscountAmount;

    [NotMapped]
    public decimal PriceWithTax => NetPrice + TaxAmount;

    [NotMapped]
    public int PendingQuantity => Quantity - ShippedQuantity;

    [NotMapped]
    public int AvailableForReturnQuantity => ShippedQuantity - ReturnedQuantity;

    [NotMapped]
    public decimal UnitPriceAfterDiscount => 
        Quantity > 0 ? (UnitPrice * Quantity - DiscountAmount) / Quantity : 0;

    [NotMapped]
    public bool IsFullyShipped => ShippedQuantity >= Quantity;

    [NotMapped]
    public bool IsPartiallyShipped => ShippedQuantity > 0 && ShippedQuantity < Quantity;

    [NotMapped]
    public bool CanBeReturned => ShippedQuantity > ReturnedQuantity;

    [NotMapped]
    public string DisplayName => !string.IsNullOrEmpty(VariantName) 
        ? $"{ProductName} - {VariantName}" 
        : ProductName;

    [NotMapped]
    public string DisplaySku => !string.IsNullOrEmpty(VariantSku) 
        ? VariantSku 
        : ProductSku ?? "";

    // Methods
    public void UpdateQuantity(int newQuantity)
    {
        if (newQuantity < 0)
        {
            throw new ArgumentException("Quantity cannot be negative");
        }

        Quantity = newQuantity;
        RecalculateTotal();
    }

    public void UpdateUnitPrice(decimal newUnitPrice)
    {
        if (newUnitPrice < 0)
        {
            throw new ArgumentException("Unit price cannot be negative");
        }

        UnitPrice = newUnitPrice;
        RecalculateTotal();
    }

    public void ApplyDiscount(decimal discountAmount)
    {
        if (discountAmount < 0)
        {
            throw new ArgumentException("Discount amount cannot be negative");
        }

        if (discountAmount > TotalPrice)
        {
            throw new ArgumentException("Discount amount cannot exceed total price");
        }

        DiscountAmount = discountAmount;
    }

    public void SetTax(decimal taxAmount)
    {
        if (taxAmount < 0)
        {
            throw new ArgumentException("Tax amount cannot be negative");
        }

        TaxAmount = taxAmount;
    }

    public void RecalculateTotal()
    {
        TotalPrice = UnitPrice * Quantity;
    }

    public void Ship(int quantityToShip)
    {
        if (quantityToShip <= 0)
        {
            throw new ArgumentException("Quantity to ship must be positive");
        }

        if (quantityToShip > PendingQuantity)
        {
            throw new ArgumentException("Cannot ship more than pending quantity");
        }

        ShippedQuantity += quantityToShip;
        
        UpdateFulfillmentStatus();
    }

    public void Return(int quantityToReturn, string? reason = null)
    {
        if (quantityToReturn <= 0)
        {
            throw new ArgumentException("Quantity to return must be positive");
        }

        if (quantityToReturn > AvailableForReturnQuantity)
        {
            throw new ArgumentException("Cannot return more than available quantity");
        }

        ReturnedQuantity += quantityToReturn;
        
        if (!string.IsNullOrEmpty(reason))
        {
            Notes = string.IsNullOrEmpty(Notes) ? $"Return reason: {reason}" : $"{Notes}; Return reason: {reason}";
        }

        UpdateFulfillmentStatus();
    }

    public void Refund(int quantityToRefund)
    {
        if (quantityToRefund <= 0)
        {
            throw new ArgumentException("Quantity to refund must be positive");
        }

        if (quantityToRefund > Quantity - RefundedQuantity)
        {
            throw new ArgumentException("Cannot refund more than available quantity");
        }

        RefundedQuantity += quantityToRefund;
        UpdateFulfillmentStatus();
    }

    private void UpdateFulfillmentStatus()
    {
        if (RefundedQuantity >= Quantity)
        {
            FulfillmentStatus = ItemFulfillmentStatus.Refunded;
        }
        else if (ReturnedQuantity >= ShippedQuantity && ShippedQuantity > 0)
        {
            FulfillmentStatus = ItemFulfillmentStatus.Returned;
        }
        else if (ShippedQuantity >= Quantity)
        {
            FulfillmentStatus = ItemFulfillmentStatus.Fulfilled;
        }
        else if (ShippedQuantity > 0)
        {
            FulfillmentStatus = ItemFulfillmentStatus.PartiallyFulfilled;
        }
        else
        {
            FulfillmentStatus = ItemFulfillmentStatus.Pending;
        }
    }

    public void SetProductInfo(string name, string? sku = null, string? imageUrl = null, string? productUrl = null)
    {
        ProductName = name;
        ProductSku = sku;
        ProductImageUrl = imageUrl;
        ProductUrl = productUrl;
    }

    public void SetVariantInfo(string? variantName = null, string? variantSku = null)
    {
        VariantName = variantName;
        VariantSku = variantSku;
    }

    public void SetDimensions(decimal? length = null, decimal? width = null, decimal? height = null, string unit = "cm")
    {
        if (length.HasValue || width.HasValue || height.HasValue)
        {
            var dimensions = new
            {
                length = length,
                width = width,
                height = height,
                unit = unit
            };
            
            Dimensions = System.Text.Json.JsonSerializer.Serialize(dimensions);
        }
    }

    public void SetWeight(decimal weight, string unit = "kg")
    {
        Weight = weight;
        WeightUnit = unit;
    }
}

public enum ItemFulfillmentStatus
{
    Pending,
    PartiallyFulfilled,
    Fulfilled,
    Returned,
    Refunded,
    Cancelled
}
