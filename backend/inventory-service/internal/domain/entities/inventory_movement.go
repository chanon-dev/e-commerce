package entities

import (
	"time"

	"github.com/google/uuid"
)

type MovementType string

const (
	MovementTypeInbound     MovementType = "inbound"
	MovementTypeOutbound    MovementType = "outbound"
	MovementTypeAdjustment  MovementType = "adjustment"
	MovementTypeTransfer    MovementType = "transfer"
	MovementTypeReturn      MovementType = "return"
	MovementTypeDamage      MovementType = "damage"
	MovementTypeExpiry      MovementType = "expiry"
	MovementTypePromotion   MovementType = "promotion"
)

type InventoryMovement struct {
	ID            uuid.UUID              `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	InventoryID   uuid.UUID              `json:"inventory_id" gorm:"type:uuid;not null;index"`
	Type          MovementType           `json:"type" gorm:"type:varchar(50);not null;index"`
	Quantity      int                    `json:"quantity" gorm:"not null"`
	PreviousQty   int                    `json:"previous_qty" gorm:"not null"`
	NewQty        int                    `json:"new_qty" gorm:"not null"`
	
	// Reference information
	Reason        string                 `json:"reason" gorm:"type:varchar(255);not null"`
	Reference     *string                `json:"reference" gorm:"type:varchar(255)"`
	OrderID       *uuid.UUID             `json:"order_id" gorm:"type:uuid;index"`
	SupplierID    *uuid.UUID             `json:"supplier_id" gorm:"type:uuid;index"`
	
	// Location information
	FromLocation  *string                `json:"from_location" gorm:"type:varchar(100)"`
	ToLocation    *string                `json:"to_location" gorm:"type:varchar(100)"`
	
	// Cost information
	UnitCost      *float64               `json:"unit_cost" gorm:"type:decimal(10,2)"`
	TotalCost     *float64               `json:"total_cost" gorm:"type:decimal(12,2)"`
	
	// User information
	CreatedBy     *string                `json:"created_by" gorm:"type:varchar(255)"`
	Notes         *string                `json:"notes" gorm:"type:text"`
	
	// Metadata
	Metadata      map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	
	// Timestamps
	CreatedAt     time.Time              `json:"created_at" gorm:"autoCreateTime;index"`
	
	// Relationships
	Inventory     Inventory              `json:"inventory" gorm:"foreignKey:InventoryID"`
}

// Business methods
func NewInventoryMovement(
	inventoryID uuid.UUID,
	movementType MovementType,
	quantity, previousQty, newQty int,
	reason string,
) *InventoryMovement {
	return &InventoryMovement{
		ID:          uuid.New(),
		InventoryID: inventoryID,
		Type:        movementType,
		Quantity:    quantity,
		PreviousQty: previousQty,
		NewQty:      newQty,
		Reason:      reason,
		Metadata:    make(map[string]interface{}),
		CreatedAt:   time.Now().UTC(),
	}
}

func (m *InventoryMovement) SetReference(reference string) {
	m.Reference = &reference
}

func (m *InventoryMovement) SetOrderID(orderID uuid.UUID) {
	m.OrderID = &orderID
}

func (m *InventoryMovement) SetSupplierID(supplierID uuid.UUID) {
	m.SupplierID = &supplierID
}

func (m *InventoryMovement) SetLocations(fromLocation, toLocation string) {
	if fromLocation != "" {
		m.FromLocation = &fromLocation
	}
	if toLocation != "" {
		m.ToLocation = &toLocation
	}
}

func (m *InventoryMovement) SetCost(unitCost float64) {
	m.UnitCost = &unitCost
	totalCost := unitCost * float64(m.Quantity)
	m.TotalCost = &totalCost
}

func (m *InventoryMovement) SetCreatedBy(createdBy string) {
	m.CreatedBy = &createdBy
}

func (m *InventoryMovement) SetNotes(notes string) {
	m.Notes = &notes
}

func (m *InventoryMovement) AddMetadata(key string, value interface{}) {
	if m.Metadata == nil {
		m.Metadata = make(map[string]interface{})
	}
	m.Metadata[key] = value
}

// Helper methods
func (m *InventoryMovement) IsInbound() bool {
	return m.Type == MovementTypeInbound || m.Type == MovementTypeReturn
}

func (m *InventoryMovement) IsOutbound() bool {
	return m.Type == MovementTypeOutbound || m.Type == MovementTypeDamage || 
		   m.Type == MovementTypeExpiry || m.Type == MovementTypePromotion
}

func (m *InventoryMovement) IsAdjustment() bool {
	return m.Type == MovementTypeAdjustment
}

func (m *InventoryMovement) IsTransfer() bool {
	return m.Type == MovementTypeTransfer
}

func (m *InventoryMovement) HasReference() bool {
	return m.Reference != nil && *m.Reference != ""
}

func (m *InventoryMovement) HasOrderID() bool {
	return m.OrderID != nil
}

func (m *InventoryMovement) HasSupplierID() bool {
	return m.SupplierID != nil
}

func (m *InventoryMovement) HasCost() bool {
	return m.UnitCost != nil && m.TotalCost != nil
}

func (m *InventoryMovement) HasNotes() bool {
	return m.Notes != nil && *m.Notes != ""
}

func (m *InventoryMovement) QuantityChange() int {
	return m.NewQty - m.PreviousQty
}

func (m *InventoryMovement) IsPositiveChange() bool {
	return m.QuantityChange() > 0
}

func (m *InventoryMovement) IsNegativeChange() bool {
	return m.QuantityChange() < 0
}

func (m *InventoryMovement) FormattedUnitCost() string {
	if m.UnitCost == nil {
		return "N/A"
	}
	return fmt.Sprintf("$%.2f", *m.UnitCost)
}

func (m *InventoryMovement) FormattedTotalCost() string {
	if m.TotalCost == nil {
		return "N/A"
	}
	return fmt.Sprintf("$%.2f", *m.TotalCost)
}

func (m *InventoryMovement) TypeDisplayName() string {
	switch m.Type {
	case MovementTypeInbound:
		return "Stock In"
	case MovementTypeOutbound:
		return "Stock Out"
	case MovementTypeAdjustment:
		return "Adjustment"
	case MovementTypeTransfer:
		return "Transfer"
	case MovementTypeReturn:
		return "Return"
	case MovementTypeDamage:
		return "Damage"
	case MovementTypeExpiry:
		return "Expiry"
	case MovementTypePromotion:
		return "Promotion"
	default:
		return string(m.Type)
	}
}

func (m *InventoryMovement) Age() time.Duration {
	return time.Since(m.CreatedAt)
}

func (m *InventoryMovement) IsRecent() bool {
	return m.Age().Hours() < 24
}

func (m *InventoryMovement) FormattedAge() string {
	age := m.Age()
	
	if age.Hours() < 1 {
		return fmt.Sprintf("%.0f minutes ago", age.Minutes())
	} else if age.Hours() < 24 {
		return fmt.Sprintf("%.0f hours ago", age.Hours())
	} else {
		return fmt.Sprintf("%.0f days ago", age.Hours()/24)
	}
}
