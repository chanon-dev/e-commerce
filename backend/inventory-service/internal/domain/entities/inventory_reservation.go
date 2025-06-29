package entities

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type ReservationStatus string

const (
	ReservationStatusActive    ReservationStatus = "active"
	ReservationStatusFulfilled ReservationStatus = "fulfilled"
	ReservationStatusReleased  ReservationStatus = "released"
	ReservationStatusExpired   ReservationStatus = "expired"
	ReservationStatusCancelled ReservationStatus = "cancelled"
)

type InventoryReservation struct {
	ID          uuid.UUID         `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	InventoryID uuid.UUID         `json:"inventory_id" gorm:"type:uuid;not null;index"`
	OrderID     uuid.UUID         `json:"order_id" gorm:"type:uuid;not null;index"`
	Quantity    int               `json:"quantity" gorm:"not null"`
	Status      ReservationStatus `json:"status" gorm:"type:varchar(50);not null;default:'active';index"`
	
	// Timing
	ExpiresAt   *time.Time        `json:"expires_at" gorm:"index"`
	FulfilledAt *time.Time        `json:"fulfilled_at"`
	ReleasedAt  *time.Time        `json:"released_at"`
	
	// Reference information
	Reason      *string           `json:"reason" gorm:"type:varchar(255)"`
	Notes       *string           `json:"notes" gorm:"type:text"`
	
	// User information
	CreatedBy   *string           `json:"created_by" gorm:"type:varchar(255)"`
	UpdatedBy   *string           `json:"updated_by" gorm:"type:varchar(255)"`
	
	// Metadata
	Metadata    map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	
	// Timestamps
	CreatedAt   time.Time         `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time         `json:"updated_at" gorm:"autoUpdateTime"`
	
	// Relationships
	Inventory   Inventory         `json:"inventory" gorm:"foreignKey:InventoryID"`
}

// Business methods
func NewInventoryReservation(
	inventoryID, orderID uuid.UUID,
	quantity int,
	expiresAt *time.Time,
) (*InventoryReservation, error) {
	if quantity <= 0 {
		return nil, errors.New("reservation quantity must be positive")
	}
	
	reservation := &InventoryReservation{
		ID:          uuid.New(),
		InventoryID: inventoryID,
		OrderID:     orderID,
		Quantity:    quantity,
		Status:      ReservationStatusActive,
		ExpiresAt:   expiresAt,
		Metadata:    make(map[string]interface{}),
		CreatedAt:   time.Now().UTC(),
		UpdatedAt:   time.Now().UTC(),
	}
	
	return reservation, nil
}

func (r *InventoryReservation) Fulfill(fulfilledBy *string) error {
	if r.Status != ReservationStatusActive {
		return errors.New("can only fulfill active reservations")
	}
	
	if r.IsExpired() {
		return errors.New("cannot fulfill expired reservation")
	}
	
	r.Status = ReservationStatusFulfilled
	now := time.Now().UTC()
	r.FulfilledAt = &now
	r.UpdatedAt = now
	
	if fulfilledBy != nil {
		r.UpdatedBy = fulfilledBy
	}
	
	return nil
}

func (r *InventoryReservation) Release(reason string, releasedBy *string) error {
	if r.Status != ReservationStatusActive {
		return errors.New("can only release active reservations")
	}
	
	r.Status = ReservationStatusReleased
	now := time.Now().UTC()
	r.ReleasedAt = &now
	r.UpdatedAt = now
	
	if reason != "" {
		r.Reason = &reason
	}
	
	if releasedBy != nil {
		r.UpdatedBy = releasedBy
	}
	
	return nil
}

func (r *InventoryReservation) Cancel(reason string, cancelledBy *string) error {
	if r.Status == ReservationStatusFulfilled {
		return errors.New("cannot cancel fulfilled reservation")
	}
	
	r.Status = ReservationStatusCancelled
	r.UpdatedAt = time.Now().UTC()
	
	if reason != "" {
		r.Reason = &reason
	}
	
	if cancelledBy != nil {
		r.UpdatedBy = cancelledBy
	}
	
	return nil
}

func (r *InventoryReservation) Expire() error {
	if r.Status != ReservationStatusActive {
		return errors.New("can only expire active reservations")
	}
	
	if !r.IsExpired() {
		return errors.New("reservation has not yet expired")
	}
	
	r.Status = ReservationStatusExpired
	r.UpdatedAt = time.Now().UTC()
	
	return nil
}

func (r *InventoryReservation) ExtendExpiry(newExpiresAt time.Time) error {
	if r.Status != ReservationStatusActive {
		return errors.New("can only extend active reservations")
	}
	
	if newExpiresAt.Before(time.Now().UTC()) {
		return errors.New("new expiry time cannot be in the past")
	}
	
	r.ExpiresAt = &newExpiresAt
	r.UpdatedAt = time.Now().UTC()
	
	return nil
}

func (r *InventoryReservation) SetNotes(notes string) {
	r.Notes = &notes
	r.UpdatedAt = time.Now().UTC()
}

func (r *InventoryReservation) SetCreatedBy(createdBy string) {
	r.CreatedBy = &createdBy
}

func (r *InventoryReservation) AddMetadata(key string, value interface{}) {
	if r.Metadata == nil {
		r.Metadata = make(map[string]interface{})
	}
	r.Metadata[key] = value
	r.UpdatedAt = time.Now().UTC()
}

// Helper methods
func (r *InventoryReservation) IsActive() bool {
	return r.Status == ReservationStatusActive && !r.IsExpired()
}

func (r *InventoryReservation) IsFulfilled() bool {
	return r.Status == ReservationStatusFulfilled
}

func (r *InventoryReservation) IsReleased() bool {
	return r.Status == ReservationStatusReleased
}

func (r *InventoryReservation) IsExpired() bool {
	return r.ExpiresAt != nil && time.Now().UTC().After(*r.ExpiresAt)
}

func (r *InventoryReservation) IsCancelled() bool {
	return r.Status == ReservationStatusCancelled
}

func (r *InventoryReservation) HasExpiry() bool {
	return r.ExpiresAt != nil
}

func (r *InventoryReservation) HasNotes() bool {
	return r.Notes != nil && *r.Notes != ""
}

func (r *InventoryReservation) HasReason() bool {
	return r.Reason != nil && *r.Reason != ""
}

func (r *InventoryReservation) TimeUntilExpiry() *time.Duration {
	if r.ExpiresAt == nil {
		return nil
	}
	
	duration := r.ExpiresAt.Sub(time.Now().UTC())
	if duration < 0 {
		duration = 0
	}
	
	return &duration
}

func (r *InventoryReservation) Age() time.Duration {
	return time.Since(r.CreatedAt)
}

func (r *InventoryReservation) IsRecent() bool {
	return r.Age().Hours() < 24
}

func (r *InventoryReservation) DurationHeld() time.Duration {
	switch r.Status {
	case ReservationStatusFulfilled:
		if r.FulfilledAt != nil {
			return r.FulfilledAt.Sub(r.CreatedAt)
		}
	case ReservationStatusReleased:
		if r.ReleasedAt != nil {
			return r.ReleasedAt.Sub(r.CreatedAt)
		}
	case ReservationStatusActive:
		return time.Since(r.CreatedAt)
	}
	
	return time.Since(r.CreatedAt)
}

func (r *InventoryReservation) StatusDisplayName() string {
	switch r.Status {
	case ReservationStatusActive:
		if r.IsExpired() {
			return "Expired"
		}
		return "Active"
	case ReservationStatusFulfilled:
		return "Fulfilled"
	case ReservationStatusReleased:
		return "Released"
	case ReservationStatusExpired:
		return "Expired"
	case ReservationStatusCancelled:
		return "Cancelled"
	default:
		return string(r.Status)
	}
}

func (r *InventoryReservation) FormattedTimeUntilExpiry() string {
	duration := r.TimeUntilExpiry()
	if duration == nil {
		return "No expiry"
	}
	
	if *duration == 0 {
		return "Expired"
	}
	
	hours := duration.Hours()
	if hours < 1 {
		return fmt.Sprintf("%.0f minutes", duration.Minutes())
	} else if hours < 24 {
		return fmt.Sprintf("%.1f hours", hours)
	} else {
		return fmt.Sprintf("%.1f days", hours/24)
	}
}

func (r *InventoryReservation) FormattedAge() string {
	age := r.Age()
	
	if age.Hours() < 1 {
		return fmt.Sprintf("%.0f minutes ago", age.Minutes())
	} else if age.Hours() < 24 {
		return fmt.Sprintf("%.0f hours ago", age.Hours())
	} else {
		return fmt.Sprintf("%.0f days ago", age.Hours()/24)
	}
}
