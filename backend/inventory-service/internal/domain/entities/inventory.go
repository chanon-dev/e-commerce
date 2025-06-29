package entities

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type InventoryStatus string

const (
	InventoryStatusActive      InventoryStatus = "active"
	InventoryStatusInactive    InventoryStatus = "inactive"
	InventoryStatusDiscontinued InventoryStatus = "discontinued"
	InventoryStatusBackorder   InventoryStatus = "backorder"
)

type StockStatus string

const (
	StockStatusInStock    StockStatus = "in_stock"
	StockStatusLowStock   StockStatus = "low_stock"
	StockStatusOutOfStock StockStatus = "out_of_stock"
	StockStatusBackorder  StockStatus = "backorder"
)

type Inventory struct {
	ID                uuid.UUID              `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ProductID         uuid.UUID              `json:"product_id" gorm:"type:uuid;not null;uniqueIndex:idx_product_variant"`
	VariantID         *uuid.UUID             `json:"variant_id" gorm:"type:uuid;uniqueIndex:idx_product_variant"`
	SKU               string                 `json:"sku" gorm:"type:varchar(100);not null;uniqueIndex"`
	
	// Stock levels
	Quantity          int                    `json:"quantity" gorm:"not null;default:0"`
	ReservedQuantity  int                    `json:"reserved_quantity" gorm:"not null;default:0"`
	AvailableQuantity int                    `json:"available_quantity" gorm:"not null;default:0"`
	
	// Thresholds
	LowStockThreshold int                    `json:"low_stock_threshold" gorm:"not null;default:10"`
	ReorderPoint      int                    `json:"reorder_point" gorm:"not null;default:5"`
	MaxStockLevel     int                    `json:"max_stock_level" gorm:"not null;default:1000"`
	
	// Status
	Status            InventoryStatus        `json:"status" gorm:"type:varchar(50);not null;default:'active'"`
	StockStatus       StockStatus            `json:"stock_status" gorm:"type:varchar(50);not null;default:'in_stock'"`
	
	// Location and warehouse
	WarehouseID       *uuid.UUID             `json:"warehouse_id" gorm:"type:uuid;index"`
	Location          *string                `json:"location" gorm:"type:varchar(100)"`
	Bin               *string                `json:"bin" gorm:"type:varchar(50)"`
	
	// Tracking
	LastRestockedAt   *time.Time             `json:"last_restocked_at"`
	LastSoldAt        *time.Time             `json:"last_sold_at"`
	LastCountedAt     *time.Time             `json:"last_counted_at"`
	
	// Costs
	UnitCost          *float64               `json:"unit_cost" gorm:"type:decimal(10,2)"`
	TotalValue        float64                `json:"total_value" gorm:"type:decimal(12,2);default:0"`
	
	// Supplier information
	SupplierID        *uuid.UUID             `json:"supplier_id" gorm:"type:uuid;index"`
	SupplierSKU       *string                `json:"supplier_sku" gorm:"type:varchar(100)"`
	LeadTimeDays      *int                   `json:"lead_time_days"`
	
	// Metadata
	Notes             *string                `json:"notes" gorm:"type:text"`
	Metadata          map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	
	// Timestamps
	CreatedAt         time.Time              `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time              `json:"updated_at" gorm:"autoUpdateTime"`
	
	// Relationships
	Movements         []InventoryMovement    `json:"movements" gorm:"foreignKey:InventoryID"`
	Reservations      []InventoryReservation `json:"reservations" gorm:"foreignKey:InventoryID"`
}

// Business methods
func NewInventory(productID uuid.UUID, sku string, initialQuantity int) (*Inventory, error) {
	if sku == "" {
		return nil, errors.New("SKU is required")
	}
	
	if initialQuantity < 0 {
		return nil, errors.New("initial quantity cannot be negative")
	}
	
	inventory := &Inventory{
		ID:                uuid.New(),
		ProductID:         productID,
		SKU:               sku,
		Quantity:          initialQuantity,
		ReservedQuantity:  0,
		AvailableQuantity: initialQuantity,
		LowStockThreshold: 10,
		ReorderPoint:      5,
		MaxStockLevel:     1000,
		Status:            InventoryStatusActive,
		Metadata:          make(map[string]interface{}),
		CreatedAt:         time.Now().UTC(),
		UpdatedAt:         time.Now().UTC(),
	}
	
	inventory.updateStockStatus()
	inventory.calculateTotalValue()
	
	return inventory, nil
}

func (i *Inventory) AddStock(quantity int, reason string, reference *string) error {
	if quantity <= 0 {
		return errors.New("quantity must be positive")
	}
	
	if i.Status != InventoryStatusActive {
		return errors.New("cannot add stock to inactive inventory")
	}
	
	oldQuantity := i.Quantity
	i.Quantity += quantity
	i.AvailableQuantity = i.Quantity - i.ReservedQuantity
	
	now := time.Now().UTC()
	i.LastRestockedAt = &now
	i.UpdatedAt = now
	
	// Create movement record
	movement := &InventoryMovement{
		ID:            uuid.New(),
		InventoryID:   i.ID,
		Type:          MovementTypeInbound,
		Quantity:      quantity,
		PreviousQty:   oldQuantity,
		NewQty:        i.Quantity,
		Reason:        reason,
		Reference:     reference,
		CreatedAt:     now,
	}
	
	i.Movements = append(i.Movements, *movement)
	i.updateStockStatus()
	i.calculateTotalValue()
	
	return nil
}

func (i *Inventory) RemoveStock(quantity int, reason string, reference *string) error {
	if quantity <= 0 {
		return errors.New("quantity must be positive")
	}
	
	if quantity > i.AvailableQuantity {
		return errors.New("insufficient available stock")
	}
	
	oldQuantity := i.Quantity
	i.Quantity -= quantity
	i.AvailableQuantity = i.Quantity - i.ReservedQuantity
	
	now := time.Now().UTC()
	i.LastSoldAt = &now
	i.UpdatedAt = now
	
	// Create movement record
	movement := &InventoryMovement{
		ID:            uuid.New(),
		InventoryID:   i.ID,
		Type:          MovementTypeOutbound,
		Quantity:      quantity,
		PreviousQty:   oldQuantity,
		NewQty:        i.Quantity,
		Reason:        reason,
		Reference:     reference,
		CreatedAt:     now,
	}
	
	i.Movements = append(i.Movements, *movement)
	i.updateStockStatus()
	i.calculateTotalValue()
	
	return nil
}

func (i *Inventory) ReserveStock(quantity int, orderID uuid.UUID, expiresAt *time.Time) error {
	if quantity <= 0 {
		return errors.New("quantity must be positive")
	}
	
	if quantity > i.AvailableQuantity {
		return errors.New("insufficient available stock for reservation")
	}
	
	// Create reservation
	reservation := &InventoryReservation{
		ID:          uuid.New(),
		InventoryID: i.ID,
		OrderID:     orderID,
		Quantity:    quantity,
		Status:      ReservationStatusActive,
		ExpiresAt:   expiresAt,
		CreatedAt:   time.Now().UTC(),
	}
	
	i.Reservations = append(i.Reservations, *reservation)
	i.ReservedQuantity += quantity
	i.AvailableQuantity = i.Quantity - i.ReservedQuantity
	i.UpdatedAt = time.Now().UTC()
	
	i.updateStockStatus()
	
	return nil
}

func (i *Inventory) ReleaseReservation(reservationID uuid.UUID) error {
	for idx, reservation := range i.Reservations {
		if reservation.ID == reservationID {
			if reservation.Status != ReservationStatusActive {
				return errors.New("reservation is not active")
			}
			
			i.Reservations[idx].Status = ReservationStatusReleased
			i.Reservations[idx].UpdatedAt = time.Now().UTC()
			i.ReservedQuantity -= reservation.Quantity
			i.AvailableQuantity = i.Quantity - i.ReservedQuantity
			i.UpdatedAt = time.Now().UTC()
			
			i.updateStockStatus()
			return nil
		}
	}
	
	return errors.New("reservation not found")
}

func (i *Inventory) FulfillReservation(reservationID uuid.UUID) error {
	for idx, reservation := range i.Reservations {
		if reservation.ID == reservationID {
			if reservation.Status != ReservationStatusActive {
				return errors.New("reservation is not active")
			}
			
			// Remove stock and fulfill reservation
			err := i.RemoveStock(reservation.Quantity, "Order fulfillment", &reservation.OrderID.String())
			if err != nil {
				return err
			}
			
			i.Reservations[idx].Status = ReservationStatusFulfilled
			i.Reservations[idx].UpdatedAt = time.Now().UTC()
			i.ReservedQuantity -= reservation.Quantity
			i.AvailableQuantity = i.Quantity - i.ReservedQuantity
			
			return nil
		}
	}
	
	return errors.New("reservation not found")
}

func (i *Inventory) AdjustStock(newQuantity int, reason string) error {
	if newQuantity < 0 {
		return errors.New("quantity cannot be negative")
	}
	
	if newQuantity < i.ReservedQuantity {
		return errors.New("new quantity cannot be less than reserved quantity")
	}
	
	oldQuantity := i.Quantity
	difference := newQuantity - oldQuantity
	
	i.Quantity = newQuantity
	i.AvailableQuantity = i.Quantity - i.ReservedQuantity
	
	now := time.Now().UTC()
	i.LastCountedAt = &now
	i.UpdatedAt = now
	
	// Create adjustment movement
	movementType := MovementTypeAdjustment
	movement := &InventoryMovement{
		ID:            uuid.New(),
		InventoryID:   i.ID,
		Type:          movementType,
		Quantity:      abs(difference),
		PreviousQty:   oldQuantity,
		NewQty:        i.Quantity,
		Reason:        reason,
		CreatedAt:     now,
	}
	
	i.Movements = append(i.Movements, *movement)
	i.updateStockStatus()
	i.calculateTotalValue()
	
	return nil
}

func (i *Inventory) SetThresholds(lowStock, reorderPoint, maxStock int) error {
	if lowStock < 0 || reorderPoint < 0 || maxStock < 0 {
		return errors.New("thresholds cannot be negative")
	}
	
	if reorderPoint > lowStock {
		return errors.New("reorder point cannot be greater than low stock threshold")
	}
	
	if maxStock < lowStock {
		return errors.New("max stock level cannot be less than low stock threshold")
	}
	
	i.LowStockThreshold = lowStock
	i.ReorderPoint = reorderPoint
	i.MaxStockLevel = maxStock
	i.UpdatedAt = time.Now().UTC()
	
	i.updateStockStatus()
	
	return nil
}

func (i *Inventory) SetLocation(warehouseID *uuid.UUID, location, bin *string) {
	i.WarehouseID = warehouseID
	i.Location = location
	i.Bin = bin
	i.UpdatedAt = time.Now().UTC()
}

func (i *Inventory) SetSupplierInfo(supplierID *uuid.UUID, supplierSKU *string, leadTimeDays *int) {
	i.SupplierID = supplierID
	i.SupplierSKU = supplierSKU
	i.LeadTimeDays = leadTimeDays
	i.UpdatedAt = time.Now().UTC()
}

func (i *Inventory) SetUnitCost(cost float64) error {
	if cost < 0 {
		return errors.New("unit cost cannot be negative")
	}
	
	i.UnitCost = &cost
	i.UpdatedAt = time.Now().UTC()
	i.calculateTotalValue()
	
	return nil
}

func (i *Inventory) SetStatus(status InventoryStatus) {
	i.Status = status
	i.UpdatedAt = time.Now().UTC()
	
	if status != InventoryStatusActive {
		i.updateStockStatus()
	}
}

func (i *Inventory) SetNotes(notes string) {
	i.Notes = &notes
	i.UpdatedAt = time.Now().UTC()
}

func (i *Inventory) AddMetadata(key string, value interface{}) {
	if i.Metadata == nil {
		i.Metadata = make(map[string]interface{})
	}
	i.Metadata[key] = value
	i.UpdatedAt = time.Now().UTC()
}

// Private methods
func (i *Inventory) updateStockStatus() {
	if i.Status != InventoryStatusActive {
		i.StockStatus = StockStatusOutOfStock
		return
	}
	
	if i.AvailableQuantity <= 0 {
		i.StockStatus = StockStatusOutOfStock
	} else if i.AvailableQuantity <= i.LowStockThreshold {
		i.StockStatus = StockStatusLowStock
	} else {
		i.StockStatus = StockStatusInStock
	}
}

func (i *Inventory) calculateTotalValue() {
	if i.UnitCost != nil {
		i.TotalValue = float64(i.Quantity) * *i.UnitCost
	} else {
		i.TotalValue = 0
	}
}

// Helper methods
func (i *Inventory) IsInStock() bool {
	return i.StockStatus == StockStatusInStock
}

func (i *Inventory) IsLowStock() bool {
	return i.StockStatus == StockStatusLowStock
}

func (i *Inventory) IsOutOfStock() bool {
	return i.StockStatus == StockStatusOutOfStock
}

func (i *Inventory) NeedsReorder() bool {
	return i.AvailableQuantity <= i.ReorderPoint
}

func (i *Inventory) IsOverstocked() bool {
	return i.Quantity > i.MaxStockLevel
}

func (i *Inventory) CanFulfillQuantity(quantity int) bool {
	return i.AvailableQuantity >= quantity && i.Status == InventoryStatusActive
}

func (i *Inventory) DaysWithoutSale() int {
	if i.LastSoldAt == nil {
		return int(time.Since(i.CreatedAt).Hours() / 24)
	}
	return int(time.Since(*i.LastSoldAt).Hours() / 24)
}

func (i *Inventory) DaysSinceRestock() int {
	if i.LastRestockedAt == nil {
		return int(time.Since(i.CreatedAt).Hours() / 24)
	}
	return int(time.Since(*i.LastRestockedAt).Hours() / 24)
}

func (i *Inventory) TurnoverRate() float64 {
	// Simple turnover calculation - would need sales data for accurate calculation
	if i.Quantity == 0 {
		return 0
	}
	
	daysSinceCreated := int(time.Since(i.CreatedAt).Hours() / 24)
	if daysSinceCreated == 0 {
		return 0
	}
	
	// Estimate based on current stock level and time
	return float64(i.Quantity) / float64(daysSinceCreated) * 365
}

func (i *Inventory) HasVariant() bool {
	return i.VariantID != nil
}

func (i *Inventory) HasLocation() bool {
	return i.Location != nil && *i.Location != ""
}

func (i *Inventory) HasSupplier() bool {
	return i.SupplierID != nil
}

func (i *Inventory) FormattedTotalValue() string {
	return fmt.Sprintf("$%.2f", i.TotalValue)
}

func (i *Inventory) FormattedUnitCost() string {
	if i.UnitCost == nil {
		return "N/A"
	}
	return fmt.Sprintf("$%.2f", *i.UnitCost)
}

// Helper function
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
