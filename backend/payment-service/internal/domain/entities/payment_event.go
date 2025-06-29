package entities

import (
	"time"

	"github.com/google/uuid"
)

type PaymentEvent struct {
	ID          uuid.UUID              `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	PaymentID   uuid.UUID              `json:"payment_id" gorm:"type:uuid;not null;index"`
	EventType   string                 `json:"event_type" gorm:"type:varchar(100);not null;index"`
	Description string                 `json:"description" gorm:"type:text;not null"`
	Data        map[string]interface{} `json:"data" gorm:"type:jsonb"`
	CreatedAt   time.Time              `json:"created_at" gorm:"autoCreateTime;index"`
	
	// Relationships
	Payment     Payment                `json:"payment" gorm:"foreignKey:PaymentID"`
}

// Business methods
func NewPaymentEvent(paymentID uuid.UUID, eventType, description string) *PaymentEvent {
	return &PaymentEvent{
		ID:          uuid.New(),
		PaymentID:   paymentID,
		EventType:   eventType,
		Description: description,
		Data:        make(map[string]interface{}),
		CreatedAt:   time.Now().UTC(),
	}
}

func (e *PaymentEvent) AddData(key string, value interface{}) {
	if e.Data == nil {
		e.Data = make(map[string]interface{})
	}
	e.Data[key] = value
}

func (e *PaymentEvent) GetData(key string) interface{} {
	if e.Data == nil {
		return nil
	}
	return e.Data[key]
}

// Helper methods
func (e *PaymentEvent) IsRecent() bool {
	return time.Since(e.CreatedAt).Hours() < 24
}

func (e *PaymentEvent) Age() time.Duration {
	return time.Since(e.CreatedAt)
}

func (e *PaymentEvent) FormattedAge() string {
	age := e.Age()
	
	if age.Hours() < 1 {
		return fmt.Sprintf("%.0f minutes ago", age.Minutes())
	} else if age.Hours() < 24 {
		return fmt.Sprintf("%.0f hours ago", age.Hours())
	} else {
		return fmt.Sprintf("%.0f days ago", age.Hours()/24)
	}
}
