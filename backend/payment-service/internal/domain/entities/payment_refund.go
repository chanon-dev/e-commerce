package entities

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type RefundStatus string

const (
	RefundStatusPending   RefundStatus = "pending"
	RefundStatusProcessing RefundStatus = "processing"
	RefundStatusCompleted RefundStatus = "completed"
	RefundStatusFailed    RefundStatus = "failed"
	RefundStatusCancelled RefundStatus = "cancelled"
)

type PaymentRefund struct {
	ID                uuid.UUID              `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	PaymentID         uuid.UUID              `json:"payment_id" gorm:"type:uuid;not null;index"`
	Amount            float64                `json:"amount" gorm:"type:decimal(10,2);not null"`
	Currency          string                 `json:"currency" gorm:"type:varchar(3);not null;default:'USD'"`
	Status            RefundStatus           `json:"status" gorm:"type:varchar(50);not null;default:'pending'"`
	Reason            string                 `json:"reason" gorm:"type:text;not null"`
	
	// External provider details
	ProviderRefundID  *string                `json:"provider_refund_id" gorm:"type:varchar(255)"`
	TransactionID     *string                `json:"transaction_id" gorm:"type:varchar(255)"`
	
	// Processing details
	ProcessedAt       *time.Time             `json:"processed_at"`
	FailureReason     *string                `json:"failure_reason" gorm:"type:text"`
	FailureCode       *string                `json:"failure_code" gorm:"type:varchar(100)"`
	
	// Admin details
	ProcessedBy       *string                `json:"processed_by" gorm:"type:varchar(255)"`
	AdminNotes        *string                `json:"admin_notes" gorm:"type:text"`
	
	// Metadata
	Metadata          map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	
	// Timestamps
	CreatedAt         time.Time              `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time              `json:"updated_at" gorm:"autoUpdateTime"`
	
	// Relationships
	Payment           Payment                `json:"payment" gorm:"foreignKey:PaymentID"`
}

// Business methods
func NewPaymentRefund(paymentID uuid.UUID, amount float64, currency, reason string) (*PaymentRefund, error) {
	if amount <= 0 {
		return nil, errors.New("refund amount must be positive")
	}
	
	if reason == "" {
		return nil, errors.New("refund reason is required")
	}
	
	if currency == "" {
		currency = "USD"
	}
	
	refund := &PaymentRefund{
		ID:        uuid.New(),
		PaymentID: paymentID,
		Amount:    amount,
		Currency:  currency,
		Status:    RefundStatusPending,
		Reason:    reason,
		Metadata:  make(map[string]interface{}),
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}
	
	return refund, nil
}

func (r *PaymentRefund) SetProcessing(processedBy string) error {
	if r.Status != RefundStatusPending {
		return errors.New("can only set processing status for pending refunds")
	}
	
	r.Status = RefundStatusProcessing
	r.ProcessedBy = &processedBy
	r.UpdatedAt = time.Now().UTC()
	
	return nil
}

func (r *PaymentRefund) Complete(transactionID string, processedAt *time.Time) error {
	if r.Status != RefundStatusProcessing && r.Status != RefundStatusPending {
		return errors.New("can only complete processing or pending refunds")
	}
	
	r.Status = RefundStatusCompleted
	r.TransactionID = &transactionID
	
	if processedAt != nil {
		r.ProcessedAt = processedAt
	} else {
		now := time.Now().UTC()
		r.ProcessedAt = &now
	}
	
	r.UpdatedAt = time.Now().UTC()
	
	return nil
}

func (r *PaymentRefund) Fail(reason, code string) error {
	if r.Status == RefundStatusCompleted {
		return errors.New("cannot fail completed refund")
	}
	
	r.Status = RefundStatusFailed
	r.FailureReason = &reason
	r.FailureCode = &code
	
	now := time.Now().UTC()
	r.ProcessedAt = &now
	r.UpdatedAt = now
	
	return nil
}

func (r *PaymentRefund) Cancel(reason string) error {
	if r.Status == RefundStatusCompleted {
		return errors.New("cannot cancel completed refund")
	}
	
	if r.Status == RefundStatusFailed {
		return errors.New("cannot cancel failed refund")
	}
	
	r.Status = RefundStatusCancelled
	r.UpdatedAt = time.Now().UTC()
	
	if reason != "" {
		r.AdminNotes = &reason
	}
	
	return nil
}

func (r *PaymentRefund) SetProviderRefundID(providerRefundID string) {
	r.ProviderRefundID = &providerRefundID
	r.UpdatedAt = time.Now().UTC()
}

func (r *PaymentRefund) SetAdminNotes(notes string) {
	r.AdminNotes = &notes
	r.UpdatedAt = time.Now().UTC()
}

func (r *PaymentRefund) AddMetadata(key string, value interface{}) {
	if r.Metadata == nil {
		r.Metadata = make(map[string]interface{})
	}
	r.Metadata[key] = value
	r.UpdatedAt = time.Now().UTC()
}

// Helper methods
func (r *PaymentRefund) IsCompleted() bool {
	return r.Status == RefundStatusCompleted
}

func (r *PaymentRefund) IsFailed() bool {
	return r.Status == RefundStatusFailed
}

func (r *PaymentRefund) IsCancelled() bool {
	return r.Status == RefundStatusCancelled
}

func (r *PaymentRefund) IsPending() bool {
	return r.Status == RefundStatusPending
}

func (r *PaymentRefund) IsProcessing() bool {
	return r.Status == RefundStatusProcessing
}

func (r *PaymentRefund) FormattedAmount() string {
	return formatMoney(r.Amount, r.Currency)
}

func (r *PaymentRefund) HasProviderRefundID() bool {
	return r.ProviderRefundID != nil && *r.ProviderRefundID != ""
}

func (r *PaymentRefund) HasTransactionID() bool {
	return r.TransactionID != nil && *r.TransactionID != ""
}

func (r *PaymentRefund) HasAdminNotes() bool {
	return r.AdminNotes != nil && *r.AdminNotes != ""
}

func (r *PaymentRefund) ProcessingTime() *time.Duration {
	if r.ProcessedAt == nil {
		return nil
	}
	
	duration := r.ProcessedAt.Sub(r.CreatedAt)
	return &duration
}

func (r *PaymentRefund) DaysSinceCreated() int {
	return int(time.Since(r.CreatedAt).Hours() / 24)
}

func (r *PaymentRefund) IsRecent() bool {
	return r.DaysSinceCreated() <= 7
}
