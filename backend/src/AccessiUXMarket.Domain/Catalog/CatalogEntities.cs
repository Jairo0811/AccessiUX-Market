namespace AccessiUXMarket.Domain.Catalog;

public enum ProductStatus
{
    Draft = 0,
    Published = 1,
    Archived = 2
}

public sealed class Category
{
    private Category() { }

    public Category(Guid id, string name, string slug, string? description, DateTime createdAtUtc)
    {
        Id = id;
        Name = name.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        IsActive = true;
        CreatedAtUtc = createdAtUtc;
    }

    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
}

public sealed class SellerProfile
{
    private SellerProfile() { }

    public SellerProfile(Guid id, Guid userId, string displayName, string slug, string? description, DateTime createdAtUtc)
    {
        Id = id;
        UserId = userId;
        DisplayName = displayName.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        IsActive = true;
        CreatedAtUtc = createdAtUtc;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string DisplayName { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
}

public sealed class Product
{
    private Product() { }

    public Product(
        Guid id,
        Guid sellerId,
        Guid categoryId,
        string name,
        string slug,
        string description,
        decimal price,
        string currency,
        int stockQuantity,
        DateTime createdAtUtc)
    {
        Id = id;
        SellerId = sellerId;
        CategoryId = categoryId;
        Name = name.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        Description = description.Trim();
        Price = price;
        Currency = currency.Trim().ToUpperInvariant();
        StockQuantity = stockQuantity;
        Status = ProductStatus.Draft;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
    }

    public Guid Id { get; private set; }
    public Guid SellerId { get; private set; }
    public Guid CategoryId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public string Currency { get; private set; } = "DOP";
    public int StockQuantity { get; private set; }
    public ProductStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public void Publish(DateTime updatedAtUtc)
    {
        if (StockQuantity <= 0)
        {
            throw new InvalidOperationException("A product without stock cannot be published.");
        }

        Status = ProductStatus.Published;
        UpdatedAtUtc = updatedAtUtc;
    }
}
