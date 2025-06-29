using PromotionService.Domain.Common;
using PromotionService.Domain.ValueObjects;

namespace PromotionService.Domain.Entities;

public class Promotion : BaseAuditableEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public PromotionType Type { get; private set; }
    public PromotionStatus Status { get; private set; }
    
    // Discount configuration
    public DiscountType DiscountType { get; private set; }
    public decimal DiscountValue { get; private set; }
    public decimal? MaxDiscountAmount { get; private set; }
    public decimal? MinOrderAmount { get; private set; }
    
    // Usage limits
    public int? MaxUsageCount { get; private set; }
    public int? MaxUsagePerUser { get; private set; }
    public int CurrentUsageCount { get; private set; }
    
    // Validity period
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    
    // Target configuration
    public bool IsPublic { get; private set; }
    public List<Guid> TargetUserIds { get; private set; } = new();
    public List<string> TargetUserGroups { get; private set; } = new();
    public List<Guid> TargetProductIds { get; private set; } = new();
    public List<Guid> TargetCategoryIds { get; private set; } = new();
    public List<string> TargetBrands { get; private set; } = new();
    
    // Conditions
    public bool RequiresMinimumQuantity { get; private set; }
    public int? MinimumQuantity { get; private set; }
    public bool IsFirstOrderOnly { get; private set; }
    public bool IsNewCustomerOnly { get; private set; }
    public List<string> AllowedCountries { get; private set; } = new();
    public List<string> ExcludedCountries { get; private set; } = new();
    
    // Stackability
    public bool CanStackWithOtherPromotions { get; private set; }
    public List<Guid> StackablePromotionIds { get; private set; } = new();
    public List<Guid> ExclusivePromotionIds { get; private set; } = new();
    
    // Priority and ordering
    public int Priority { get; private set; }
    public bool AutoApply { get; private set; }
    
    // Metadata
    public Dictionary<string, object> Metadata { get; private set; } = new();
    public string? Terms { get; private set; }
    public string? ImageUrl { get; private set; }
    public string? BannerUrl { get; private set; }
    
    // Navigation properties
    private readonly List<PromotionUsage> _usages = new();
    public IReadOnlyCollection<PromotionUsage> Usages => _usages.AsReadOnly();
    
    private readonly List<PromotionRule> _rules = new();
    public IReadOnlyCollection<PromotionRule> Rules => _rules.AsReadOnly();

    // Constructors
    private Promotion() { } // For EF Core
    
    public static Promotion Create(
        string name,
        string description,
        string code,
        PromotionType type,
        DiscountType discountType,
        decimal discountValue,
        DateTime startDate,
        DateTime endDate)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Promotion name is required", nameof(name));
            
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Promotion code is required", nameof(code));
            
        if (discountValue <= 0)
            throw new ArgumentException("Discount value must be positive", nameof(discountValue));
            
        if (startDate >= endDate)
            throw new ArgumentException("Start date must be before end date");
            
        if (discountType == DiscountType.Percentage && discountValue > 100)
            throw new ArgumentException("Percentage discount cannot exceed 100%");
        
        var promotion = new Promotion
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            Code = code.ToUpperInvariant(),
            Type = type,
            Status = PromotionStatus.Draft,
            DiscountType = discountType,
            DiscountValue = discountValue,
            StartDate = startDate,
            EndDate = endDate,
            IsPublic = true,
            Priority = 0,
            CurrentUsageCount = 0
        };
        
        return promotion;
    }
    
    // Business methods
    public void Activate()
    {
        if (Status == PromotionStatus.Active)
            throw new InvalidOperationException("Promotion is already active");
            
        if (Status == PromotionStatus.Expired)
            throw new InvalidOperationException("Cannot activate expired promotion");
            
        if (DateTime.UtcNow > EndDate)
            throw new InvalidOperationException("Cannot activate promotion past end date");
        
        Status = PromotionStatus.Active;
    }
    
    public void Deactivate()
    {
        if (Status != PromotionStatus.Active)
            throw new InvalidOperationException("Can only deactivate active promotions");
        
        Status = PromotionStatus.Inactive;
    }
    
    public void Expire()
    {
        Status = PromotionStatus.Expired;
    }
    
    public void SetMaxUsage(int? maxUsageCount, int? maxUsagePerUser = null)
    {
        if (maxUsageCount.HasValue && maxUsageCount.Value <= 0)
            throw new ArgumentException("Max usage count must be positive", nameof(maxUsageCount));
            
        if (maxUsagePerUser.HasValue && maxUsagePerUser.Value <= 0)
            throw new ArgumentException("Max usage per user must be positive", nameof(maxUsagePerUser));
        
        MaxUsageCount = maxUsageCount;
        MaxUsagePerUser = maxUsagePerUser;
    }
    
    public void SetMinimumOrderAmount(decimal amount)
    {
        if (amount < 0)
            throw new ArgumentException("Minimum order amount cannot be negative", nameof(amount));
        
        MinOrderAmount = amount;
    }
    
    public void SetMaxDiscountAmount(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Max discount amount must be positive", nameof(amount));
        
        MaxDiscountAmount = amount;
    }
    
    public void SetTargetUsers(List<Guid> userIds, List<string> userGroups = null)
    {
        TargetUserIds = userIds ?? new List<Guid>();
        TargetUserGroups = userGroups ?? new List<string>();
        IsPublic = !TargetUserIds.Any() && !TargetUserGroups.Any();
    }
    
    public void SetTargetProducts(List<Guid> productIds, List<Guid> categoryIds = null, List<string> brands = null)
    {
        TargetProductIds = productIds ?? new List<Guid>();
        TargetCategoryIds = categoryIds ?? new List<Guid>();
        TargetBrands = brands ?? new List<string>();
    }
    
    public void SetGeographicRestrictions(List<string> allowedCountries = null, List<string> excludedCountries = null)
    {
        AllowedCountries = allowedCountries ?? new List<string>();
        ExcludedCountries = excludedCountries ?? new List<string>();
    }
    
    public void SetCustomerRestrictions(bool isFirstOrderOnly = false, bool isNewCustomerOnly = false)
    {
        IsFirstOrderOnly = isFirstOrderOnly;
        IsNewCustomerOnly = isNewCustomerOnly;
    }
    
    public void SetQuantityRequirement(int minimumQuantity)
    {
        if (minimumQuantity <= 0)
            throw new ArgumentException("Minimum quantity must be positive", nameof(minimumQuantity));
        
        RequiresMinimumQuantity = true;
        MinimumQuantity = minimumQuantity;
    }
    
    public void RemoveQuantityRequirement()
    {
        RequiresMinimumQuantity = false;
        MinimumQuantity = null;
    }
    
    public void SetStackability(bool canStack, List<Guid> stackableWith = null, List<Guid> exclusiveWith = null)
    {
        CanStackWithOtherPromotions = canStack;
        StackablePromotionIds = stackableWith ?? new List<Guid>();
        ExclusivePromotionIds = exclusiveWith ?? new List<Guid>();
    }
    
    public void SetPriority(int priority)
    {
        Priority = priority;
    }
    
    public void SetAutoApply(bool autoApply)
    {
        AutoApply = autoApply;
    }
    
    public void SetTerms(string terms)
    {
        Terms = terms;
    }
    
    public void SetImages(string imageUrl = null, string bannerUrl = null)
    {
        ImageUrl = imageUrl;
        BannerUrl = bannerUrl;
    }
    
    public void AddMetadata(string key, object value)
    {
        Metadata[key] = value;
    }
    
    public void AddRule(PromotionRule rule)
    {
        _rules.Add(rule);
    }
    
    public void RemoveRule(Guid ruleId)
    {
        var rule = _rules.FirstOrDefault(r => r.Id == ruleId);
        if (rule != null)
        {
            _rules.Remove(rule);
        }
    }
    
    public PromotionUsage RecordUsage(Guid userId, Guid orderId, decimal orderAmount, decimal discountAmount)
    {
        if (!CanBeUsed(userId, orderAmount))
            throw new InvalidOperationException("Promotion cannot be used");
        
        var usage = PromotionUsage.Create(Id, userId, orderId, orderAmount, discountAmount);
        _usages.Add(usage);
        CurrentUsageCount++;
        
        return usage;
    }
    
    public bool CanBeUsed(Guid userId, decimal orderAmount, int quantity = 1, string country = null)
    {
        // Check if promotion is active
        if (Status != PromotionStatus.Active)
            return false;
            
        // Check date validity
        var now = DateTime.UtcNow;
        if (now < StartDate || now > EndDate)
            return false;
            
        // Check usage limits
        if (MaxUsageCount.HasValue && CurrentUsageCount >= MaxUsageCount.Value)
            return false;
            
        if (MaxUsagePerUser.HasValue)
        {
            var userUsageCount = _usages.Count(u => u.UserId == userId);
            if (userUsageCount >= MaxUsagePerUser.Value)
                return false;
        }
        
        // Check minimum order amount
        if (MinOrderAmount.HasValue && orderAmount < MinOrderAmount.Value)
            return false;
            
        // Check minimum quantity
        if (RequiresMinimumQuantity && MinimumQuantity.HasValue && quantity < MinimumQuantity.Value)
            return false;
            
        // Check geographic restrictions
        if (!string.IsNullOrEmpty(country))
        {
            if (AllowedCountries.Any() && !AllowedCountries.Contains(country))
                return false;
                
            if (ExcludedCountries.Contains(country))
                return false;
        }
        
        // Check user targeting
        if (!IsPublic)
        {
            if (TargetUserIds.Any() && !TargetUserIds.Contains(userId))
                return false;
        }
        
        return true;
    }
    
    public decimal CalculateDiscount(decimal orderAmount, int quantity = 1)
    {
        if (!CanBeUsed(Guid.Empty, orderAmount, quantity))
            return 0;
        
        decimal discount = 0;
        
        switch (DiscountType)
        {
            case DiscountType.FixedAmount:
                discount = DiscountValue;
                break;
                
            case DiscountType.Percentage:
                discount = orderAmount * (DiscountValue / 100);
                break;
                
            case DiscountType.BuyXGetY:
                // Implementation would depend on specific BXGY rules
                discount = CalculateBuyXGetYDiscount(orderAmount, quantity);
                break;
        }
        
        // Apply maximum discount limit
        if (MaxDiscountAmount.HasValue && discount > MaxDiscountAmount.Value)
        {
            discount = MaxDiscountAmount.Value;
        }
        
        // Ensure discount doesn't exceed order amount
        if (discount > orderAmount)
        {
            discount = orderAmount;
        }
        
        return Math.Round(discount, 2);
    }
    
    private decimal CalculateBuyXGetYDiscount(decimal orderAmount, int quantity)
    {
        // This would be implemented based on specific BXGY rules
        // For now, return a simple calculation
        return 0;
    }
    
    // Helper properties
    public bool IsActive => Status == PromotionStatus.Active;
    public bool IsExpired => Status == PromotionStatus.Expired || DateTime.UtcNow > EndDate;
    public bool IsUpcoming => DateTime.UtcNow < StartDate;
    public bool HasUsageLimit => MaxUsageCount.HasValue;
    public bool HasUserLimit => MaxUsagePerUser.HasValue;
    public bool IsUnlimitedUsage => !MaxUsageCount.HasValue;
    public bool HasMinimumOrder => MinOrderAmount.HasValue;
    public bool HasMaxDiscount => MaxDiscountAmount.HasValue;
    public bool IsTargeted => !IsPublic;
    public bool HasGeographicRestrictions => AllowedCountries.Any() || ExcludedCountries.Any();
    public bool HasCustomerRestrictions => IsFirstOrderOnly || IsNewCustomerOnly;
    public int RemainingUsage => MaxUsageCount.HasValue ? Math.Max(0, MaxUsageCount.Value - CurrentUsageCount) : int.MaxValue;
    public double UsagePercentage => MaxUsageCount.HasValue ? (double)CurrentUsageCount / MaxUsageCount.Value * 100 : 0;
    public TimeSpan TimeUntilStart => StartDate > DateTime.UtcNow ? StartDate - DateTime.UtcNow : TimeSpan.Zero;
    public TimeSpan TimeUntilEnd => EndDate > DateTime.UtcNow ? EndDate - DateTime.UtcNow : TimeSpan.Zero;
    public int DaysActive => (int)(EndDate - StartDate).TotalDays;
    public bool IsPercentageDiscount => DiscountType == DiscountType.Percentage;
    public bool IsFixedAmountDiscount => DiscountType == DiscountType.FixedAmount;
    public string FormattedDiscount => DiscountType == DiscountType.Percentage ? $"{DiscountValue}%" : $"${DiscountValue:F2}";
}

public enum PromotionType
{
    Coupon = 0,
    Sale = 1,
    BuyOneGetOne = 2,
    BuyXGetY = 3,
    FreeShipping = 4,
    LoyaltyReward = 5,
    NewCustomer = 6,
    Seasonal = 7,
    Flash = 8,
    Bundle = 9
}

public enum PromotionStatus
{
    Draft = 0,
    Active = 1,
    Inactive = 2,
    Expired = 3,
    Cancelled = 4
}

public enum DiscountType
{
    FixedAmount = 0,
    Percentage = 1,
    BuyXGetY = 2,
    FreeShipping = 3
}
