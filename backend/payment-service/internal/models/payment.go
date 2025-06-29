package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Payment struct {
	ID                uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	OrderID           uuid.UUID      `json:"order_id" gorm:"type:uuid;not null;index"`
	UserID            uuid.UUID      `json:"user_id" gorm:"type:uuid;not null;index"`
	Amount            float64        `json:"amount" gorm:"not null"`
	Currency          string         `json:"currency" gorm:"not null;default:'USD'"`
	Status            PaymentStatus  `json:"status" gorm:"default:'pending'"`
	Method            PaymentMethod  `json:"method" gorm:"not null"`
	Gateway           PaymentGateway `json:"gateway" gorm:"not null"`
	GatewayPaymentID  string         `json:"gateway_payment_id" gorm:"index"`
	TransactionID     string         `json:"transaction_id" gorm:"unique;index"`
	Description       string         `json:"description"`
	Metadata          JSON           `json:"metadata" gorm:"type:jsonb"`
	FailureReason     string         `json:"failure_reason,omitempty"`
	RefundedAmount    float64        `json:"refunded_amount" gorm:"default:0"`
	RefundedAt        *time.Time     `json:"refunded_at,omitempty"`
	ProcessedAt       *time.Time     `json:"processed_at,omitempty"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

type PaymentMethod struct {
	ID           uuid.UUID           `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID       uuid.UUID           `json:"user_id" gorm:"type:uuid;not null;index"`
	Type         PaymentMethodType   `json:"type" gorm:"not null"`
	Provider     PaymentGateway      `json:"provider" gorm:"not null"`
	ProviderID   string              `json:"provider_id" gorm:"not null"`
	IsDefault    bool                `json:"is_default" gorm:"default:false"`
	IsActive     bool                `json:"is_active" gorm:"default:true"`
	CardDetails  *CardDetails        `json:"card_details,omitempty" gorm:"embedded"`
	BankDetails  *BankDetails        `json:"bank_details,omitempty" gorm:"embedded"`
	WalletDetails *WalletDetails     `json:"wallet_details,omitempty" gorm:"embedded"`
	ExpiresAt    *time.Time          `json:"expires_at,omitempty"`
	CreatedAt    time.Time           `json:"created_at"`
	UpdatedAt    time.Time           `json:"updated_at"`
	DeletedAt    gorm.DeletedAt      `json:"deleted_at,omitempty" gorm:"index"`
}

type CardDetails struct {
	Last4       string `json:"last4"`
	Brand       string `json:"brand"`
	ExpiryMonth int    `json:"expiry_month"`
	ExpiryYear  int    `json:"expiry_year"`
	Fingerprint string `json:"fingerprint"`
	Country     string `json:"country"`
}

type BankDetails struct {
	BankName      string `json:"bank_name"`
	AccountNumber string `json:"account_number"`
	RoutingNumber string `json:"routing_number"`
	AccountType   string `json:"account_type"`
}

type WalletDetails struct {
	WalletType string `json:"wallet_type"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
}

type PaymentRefund struct {
	ID            uuid.UUID     `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	PaymentID     uuid.UUID     `json:"payment_id" gorm:"type:uuid;not null;index"`
	Amount        float64       `json:"amount" gorm:"not null"`
	Currency      string        `json:"currency" gorm:"not null"`
	Reason        string        `json:"reason"`
	Status        RefundStatus  `json:"status" gorm:"default:'pending'"`
	GatewayRefundID string      `json:"gateway_refund_id"`
	ProcessedAt   *time.Time    `json:"processed_at,omitempty"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
	
	// Relationship
	Payment       Payment       `json:"payment" gorm:"foreignKey:PaymentID"`
}

type PaymentWebhook struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Gateway   PaymentGateway `json:"gateway" gorm:"not null"`
	EventType string         `json:"event_type" gorm:"not null"`
	EventID   string         `json:"event_id" gorm:"unique;not null"`
	Payload   JSON           `json:"payload" gorm:"type:jsonb"`
	Processed bool           `json:"processed" gorm:"default:false"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

// Enums
type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusProcessing PaymentStatus = "processing"
	PaymentStatusSucceeded PaymentStatus = "succeeded"
	PaymentStatusFailed    PaymentStatus = "failed"
	PaymentStatusCanceled  PaymentStatus = "canceled"
	PaymentStatusRefunded  PaymentStatus = "refunded"
)

type PaymentMethod string

const (
	PaymentMethodCard         PaymentMethod = "card"
	PaymentMethodBankTransfer PaymentMethod = "bank_transfer"
	PaymentMethodWallet       PaymentMethod = "wallet"
	PaymentMethodCrypto       PaymentMethod = "crypto"
	PaymentMethodCOD          PaymentMethod = "cod"
)

type PaymentGateway string

const (
	PaymentGatewayStripe  PaymentGateway = "stripe"
	PaymentGatewayPayPal  PaymentGateway = "paypal"
	PaymentGatewaySquare  PaymentGateway = "square"
	PaymentGatewayRazorpay PaymentGateway = "razorpay"
	PaymentGatewayInternal PaymentGateway = "internal"
)

type PaymentMethodType string

const (
	PaymentMethodTypeCard   PaymentMethodType = "card"
	PaymentMethodTypeBank   PaymentMethodType = "bank"
	PaymentMethodTypeWallet PaymentMethodType = "wallet"
)

type RefundStatus string

const (
	RefundStatusPending   RefundStatus = "pending"
	RefundStatusProcessing RefundStatus = "processing"
	RefundStatusSucceeded RefundStatus = "succeeded"
	RefundStatusFailed    RefundStatus = "failed"
	RefundStatusCanceled  RefundStatus = "canceled"
)

// JSON type for JSONB fields
type JSON map[string]interface{}

// BeforeCreate hooks
func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	if p.TransactionID == "" {
		p.TransactionID = generateTransactionID()
	}
	return nil
}

func (pm *PaymentMethod) BeforeCreate(tx *gorm.DB) error {
	if pm.ID == uuid.Nil {
		pm.ID = uuid.New()
	}
	return nil
}

func (pr *PaymentRefund) BeforeCreate(tx *gorm.DB) error {
	if pr.ID == uuid.Nil {
		pr.ID = uuid.New()
	}
	return nil
}

func (pw *PaymentWebhook) BeforeCreate(tx *gorm.DB) error {
	if pw.ID == uuid.Nil {
		pw.ID = uuid.New()
	}
	return nil
}

// Helper functions
func generateTransactionID() string {
	return "TXN_" + uuid.New().String()[:8]
}

// Computed properties
func (p *Payment) IsRefundable() bool {
	return p.Status == PaymentStatusSucceeded && p.RefundedAmount < p.Amount
}

func (p *Payment) RemainingRefundableAmount() float64 {
	return p.Amount - p.RefundedAmount
}
