package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Product represents the core business entity
type Product struct {
	id          ProductID
	name        string
	description string
	sku         string
	price       Money
	comparePrice *Money
	categoryID  CategoryID
	brand       string
	images      []ProductImage
	tags        []string
	status      ProductStatus
	isActive    bool
	isFeatured  bool
	inventory   ProductInventory
	seo         ProductSEO
	createdAt   time.Time
	updatedAt   time.Time
	version     int // For optimistic locking
}

// Value Objects
type ProductID struct {
	value uuid.UUID
}

func NewProductID() ProductID {
	return ProductID{value: uuid.New()}
}

func ProductIDFromString(s string) (ProductID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return ProductID{}, err
	}
	return ProductID{value: id}, nil
}

func (p ProductID) String() string {
	return p.value.String()
}

func (p ProductID) Equals(other ProductID) bool {
	return p.value == other.value
}

type Money struct {
	amount   int64  // Store as cents to avoid floating point issues
	currency string
}

func NewMoney(amount float64, currency string) Money {
	return Money{
		amount:   int64(amount * 100), // Convert to cents
		currency: currency,
	}
}

func (m Money) Amount() float64 {
	return float64(m.amount) / 100
}

func (m Money) Currency() string {
	return m.currency
}

func (m Money) Add(other Money) (Money, error) {
	if m.currency != other.currency {
		return Money{}, errors.New("cannot add different currencies")
	}
	return Money{
		amount:   m.amount + other.amount,
		currency: m.currency,
	}, nil
}

func (m Money) Subtract(other Money) (Money, error) {
	if m.currency != other.currency {
		return Money{}, errors.New("cannot subtract different currencies")
	}
	return Money{
		amount:   m.amount - other.amount,
		currency: m.currency,
	}, nil
}

func (m Money) IsGreaterThan(other Money) bool {
	return m.currency == other.currency && m.amount > other.amount
}

type CategoryID struct {
	value uuid.UUID
}

func NewCategoryID() CategoryID {
	return CategoryID{value: uuid.New()}
}

func CategoryIDFromString(s string) (CategoryID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return CategoryID{}, err
	}
	return CategoryID{value: id}, nil
}

func (c CategoryID) String() string {
	return c.value.String()
}

type ProductImage struct {
	id       uuid.UUID
	url      string
	altText  string
	position int
	isMain   bool
}

type ProductInventory struct {
	quantity    int
	reserved    int
	lowStock    int
	trackStock  bool
	allowBackorder bool
}

type ProductSEO struct {
	title       string
	description string
	keywords    []string
	slug        string
}

type ProductStatus int

const (
	ProductStatusDraft ProductStatus = iota
	ProductStatusActive
	ProductStatusInactive
	ProductStatusArchived
)

// Factory method for creating new products
func NewProduct(
	name, description, sku string,
	price Money,
	categoryID CategoryID,
	brand string,
) (*Product, error) {
	// Business rules validation
	if err := validateProductName(name); err != nil {
		return nil, err
	}
	
	if err := validateSKU(sku); err != nil {
		return nil, err
	}
	
	if err := validatePrice(price); err != nil {
		return nil, err
	}

	product := &Product{
		id:          NewProductID(),
		name:        name,
		description: description,
		sku:         sku,
		price:       price,
		categoryID:  categoryID,
		brand:       brand,
		status:      ProductStatusDraft,
		isActive:    false,
		isFeatured:  false,
		inventory:   ProductInventory{trackStock: true},
		createdAt:   time.Now().UTC(),
		updatedAt:   time.Now().UTC(),
		version:     1,
	}

	return product, nil
}

// Business methods
func (p *Product) UpdatePrice(newPrice Money) error {
	if err := validatePrice(newPrice); err != nil {
		return err
	}
	
	p.price = newPrice
	p.updatedAt = time.Now().UTC()
	p.version++
	
	return nil
}

func (p *Product) SetComparePrice(comparePrice Money) error {
	if !comparePrice.IsGreaterThan(p.price) {
		return errors.New("compare price must be greater than current price")
	}
	
	p.comparePrice = &comparePrice
	p.updatedAt = time.Now().UTC()
	p.version++
	
	return nil
}

func (p *Product) Activate() error {
	if p.status == ProductStatusArchived {
		return errors.New("cannot activate archived product")
	}
	
	p.status = ProductStatusActive
	p.isActive = true
	p.updatedAt = time.Now().UTC()
	p.version++
	
	return nil
}

func (p *Product) Deactivate() {
	p.status = ProductStatusInactive
	p.isActive = false
	p.updatedAt = time.Now().UTC()
	p.version++
}

func (p *Product) SetAsFeatured() {
	p.isFeatured = true
	p.updatedAt = time.Now().UTC()
	p.version++
}

func (p *Product) RemoveFromFeatured() {
	p.isFeatured = false
	p.updatedAt = time.Now().UTC()
	p.version++
}

func (p *Product) AddImage(url, altText string, position int, isMain bool) error {
	if isMain {
		// Remove main flag from existing images
		for i := range p.images {
			p.images[i].isMain = false
		}
	}
	
	image := ProductImage{
		id:       uuid.New(),
		url:      url,
		altText:  altText,
		position: position,
		isMain:   isMain,
	}
	
	p.images = append(p.images, image)
	p.updatedAt = time.Now().UTC()
	p.version++
	
	return nil
}

func (p *Product) UpdateInventory(quantity, reserved, lowStock int, trackStock, allowBackorder bool) {
	p.inventory = ProductInventory{
		quantity:       quantity,
		reserved:       reserved,
		lowStock:       lowStock,
		trackStock:     trackStock,
		allowBackorder: allowBackorder,
	}
	p.updatedAt = time.Now().UTC()
	p.version++
}

func (p *Product) UpdateSEO(title, description, slug string, keywords []string) {
	p.seo = ProductSEO{
		title:       title,
		description: description,
		keywords:    keywords,
		slug:        slug,
	}
	p.updatedAt = time.Now().UTC()
	p.version++
}

// Getters (following encapsulation principles)
func (p *Product) ID() ProductID { return p.id }
func (p *Product) Name() string { return p.name }
func (p *Product) Description() string { return p.description }
func (p *Product) SKU() string { return p.sku }
func (p *Product) Price() Money { return p.price }
func (p *Product) ComparePrice() *Money { return p.comparePrice }
func (p *Product) CategoryID() CategoryID { return p.categoryID }
func (p *Product) Brand() string { return p.brand }
func (p *Product) Images() []ProductImage { return p.images }
func (p *Product) Tags() []string { return p.tags }
func (p *Product) Status() ProductStatus { return p.status }
func (p *Product) IsActive() bool { return p.isActive }
func (p *Product) IsFeatured() bool { return p.isFeatured }
func (p *Product) Inventory() ProductInventory { return p.inventory }
func (p *Product) SEO() ProductSEO { return p.seo }
func (p *Product) CreatedAt() time.Time { return p.createdAt }
func (p *Product) UpdatedAt() time.Time { return p.updatedAt }
func (p *Product) Version() int { return p.version }

// Business rules validation
func validateProductName(name string) error {
	if len(name) < 2 {
		return errors.New("product name must be at least 2 characters")
	}
	if len(name) > 255 {
		return errors.New("product name must not exceed 255 characters")
	}
	return nil
}

func validateSKU(sku string) error {
	if len(sku) < 3 {
		return errors.New("SKU must be at least 3 characters")
	}
	if len(sku) > 50 {
		return errors.New("SKU must not exceed 50 characters")
	}
	return nil
}

func validatePrice(price Money) error {
	if price.Amount() <= 0 {
		return errors.New("price must be greater than zero")
	}
	return nil
}

// Domain events (for event sourcing if needed)
type ProductEvent interface {
	EventType() string
	AggregateID() ProductID
	OccurredAt() time.Time
}

type ProductCreatedEvent struct {
	productID ProductID
	name      string
	sku       string
	price     Money
	occurredAt time.Time
}

func (e ProductCreatedEvent) EventType() string { return "ProductCreated" }
func (e ProductCreatedEvent) AggregateID() ProductID { return e.productID }
func (e ProductCreatedEvent) OccurredAt() time.Time { return e.occurredAt }

type ProductPriceChangedEvent struct {
	productID ProductID
	oldPrice  Money
	newPrice  Money
	occurredAt time.Time
}

func (e ProductPriceChangedEvent) EventType() string { return "ProductPriceChanged" }
func (e ProductPriceChangedEvent) AggregateID() ProductID { return e.productID }
func (e ProductPriceChangedEvent) OccurredAt() time.Time { return e.occurredAt }
