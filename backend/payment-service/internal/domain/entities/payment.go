package entities

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type PaymentStatus string

const (
	PaymentStatusPending           PaymentStatus = "pending"
	PaymentStatusProcessing        PaymentStatus = "processing"
	PaymentStatusCompleted         PaymentStatus = "completed"
	PaymentStatusFailed            PaymentStatus = "failed"
	PaymentStatusCancelled         PaymentStatus = "cancelled"
	PaymentStatusRefunded          PaymentStatus = "refunded"
	PaymentStatusPartiallyRefunded PaymentStatus = "partially_refunded"
	PaymentStatusExpired           PaymentStatus = "expired"
)

type PaymentMethod string

const (
	PaymentMethodCreditCard PaymentMethod = "credit_card"
	PaymentMethodDebitCard  PaymentMethod = "debit_card"
	PaymentMethodPayPal     PaymentMethod = "paypal"
	PaymentMethodStripe     PaymentMethod = "stripe"
	PaymentMethodBankTransfer PaymentMethod = "bank_transfer"
	PaymentMethodCrypto     PaymentMethod = "crypto"
	PaymentMethodWallet     PaymentMethod = "wallet"
)

type Payment struct {
	ID                uuid.UUID              `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	OrderID           uuid.UUID              `json:"order_id" gorm:"type:uuid;not null;index"`
	UserID            uuid.UUID              `json:"user_id" gorm:"type:uuid;not null;index"`
	Amount            float64                `json:"amount" gorm:"type:decimal(10,2);not null"`
	Currency          string                 `json:"currency" gorm:"type:varchar(3);not null;default:'USD'"`
	Status            PaymentStatus          `json:"status" gorm:"type:varchar(50);not null;default:'pending';index"`
	Method            PaymentMethod          `json:"method" gorm:"type:varchar(50);not null"`
	
	// External payment provider details
	ProviderID        string                 `json:"provider_id" gorm:"type:varchar(100)"`
	PaymentIntentID   *string                `json:"payment_intent_id" gorm:"type:varchar(255)"`
	TransactionID     *string                `json:"transaction_id" gorm:"type:varchar(255);index"`
	
	// Payment details
	Description       string                 `json:"description" gorm:"type:text"`
	CustomerEmail     string                 `json:"customer_email" gorm:"type:varchar(255);not null"`
	CustomerName      string                 `json:"customer_name" gorm:"type:varchar(255);not null"`
	
	// Billing information
	BillingAddress    *Address               `json:"billing_address" gorm:"embedded;embeddedPrefix:billing_"`
	
	// Payment method details
	CardLast4         *string                `json:"card_last4" gorm:"type:varchar(4)"`
	CardBrand         *string                `json:"card_brand" gorm:"type:varchar(50)"`
	CardExpMonth      *int                   `json:"card_exp_month"`
	CardExpYear       *int                   `json:"card_exp_year"`
	
	// Processing details
	ProcessedAt       *time.Time             `json:"processed_at"`
	FailureReason     *string                `json:"failure_reason" gorm:"type:text"`
	FailureCode       *string                `json:"failure_code" gorm:"type:varchar(100)"`
	
	// Refund information
	RefundedAmount    float64                `json:"refunded_amount" gorm:"type:decimal(10,2);default:0"`
	RefundedAt        *time.Time             `json:"refunded_at"`
	RefundReason      *string                `json:"refund_reason" gorm:"type:text"`
	
	// Metadata and tracking
	Metadata          map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	IPAddress         *string                `json:"ip_address" gorm:"type:varchar(45)"`
	UserAgent         *string                `json:"user_agent" gorm:"type:text"`
	
	// Timestamps
	CreatedAt         time.Time              `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time              `json:"updated_at" gorm:"autoUpdateTime"`
	ExpiresAt         *time.Time             `json:"expires_at" gorm:"index"`
	
	// Relationships
	Refunds           []PaymentRefund        `json:"refunds" gorm:"foreignKey:PaymentID"`
	Events            []PaymentEvent         `json:"events" gorm:"foreignKey:PaymentID"`
}

type Address struct {
	Street     string  `json:"street" gorm:"type:varchar(255)"`
	Street2    *string `json:"street2" gorm:"type:varchar(255)"`
	City       string  `json:"city" gorm:"type:varchar(100)"`
	State      string  `json:"state" gorm:"type:varchar(100)"`
	PostalCode string  `json:"postal_code" gorm:"type:varchar(20)"`
	Country    string  `json:"country" gorm:"type:varchar(2)"`
}

// Business methods
func NewPayment(orderID, userID uuid.UUID, amount float64, currency string, method PaymentMethod, customerEmail, customerName string) (*Payment, error) {
	if amount <= 0 {
		return nil, errors.New("payment amount must be positive")
	}
	
	if currency == "" {
		currency = "USD"
	}
	
	if customerEmail == "" {
		return nil, errors.New("customer email is required")
	}
	
	if customerName == "" {
		return nil, errors.New("customer name is required")
	}
	
	payment := &Payment{
		ID:            uuid.New(),
		OrderID:       orderID,
		UserID:        userID,
		Amount:        amount,
		Currency:      currency,
		Status:        PaymentStatusPending,
		Method:        method,
		CustomerEmail: customerEmail,
		CustomerName:  customerName,
		Metadata:      make(map[string]interface{}),
		CreatedAt:     time.Now().UTC(),
		UpdatedAt:     time.Now().UTC(),
	}
	
	// Set expiration time (30 minutes for pending payments)
	expiresAt := time.Now().UTC().Add(30 * time.Minute)
	payment.ExpiresAt = &expiresAt
	
	return payment, nil
}

func (p *Payment) SetProcessing() error {
	if p.Status != PaymentStatusPending {
		return errors.New("can only set processing status for pending payments")
	}
	
	p.Status = PaymentStatusProcessing
	p.UpdatedAt = time.Now().UTC()
	p.addEvent("payment_processing", "Payment processing started")
	
	return nil
}

func (p *Payment) Complete(transactionID string, processedAt *time.Time) error {
	if p.Status != PaymentStatusProcessing && p.Status != PaymentStatusPending {
		return errors.New("can only complete processing or pending payments")
	}
	
	p.Status = PaymentStatusCompleted
	p.TransactionID = &transactionID
	
	if processedAt != nil {
		p.ProcessedAt = processedAt
	} else {
		now := time.Now().UTC()
		p.ProcessedAt = &now
	}
	
	p.UpdatedAt = time.Now().UTC()
	p.ExpiresAt = nil // Remove expiration for completed payments
	p.addEvent("payment_completed", "Payment completed successfully")
	
	return nil
}

func (p *Payment) Fail(reason, code string) error {
	if p.Status == PaymentStatusCompleted {
		return errors.New("cannot fail completed payment")
	}
	
	p.Status = PaymentStatusFailed
	p.FailureReason = &reason
	p.FailureCode = &code
	
	now := time.Now().UTC()
	p.ProcessedAt = &now
	p.UpdatedAt = now
	
	p.addEvent("payment_failed", reason)
	
	return nil
}

func (p *Payment) Cancel(reason string) error {
	if p.Status == PaymentStatusCompleted {
		return errors.New("cannot cancel completed payment")
	}
	
	if p.Status == PaymentStatusFailed {
		return errors.New("cannot cancel failed payment")
	}
	
	p.Status = PaymentStatusCancelled
	p.UpdatedAt = time.Now().UTC()
	p.addEvent("payment_cancelled", reason)
	
	return nil
}

func (p *Payment) Refund(amount float64, reason string) error {
	if p.Status != PaymentStatusCompleted {
		return errors.New("can only refund completed payments")
	}
	
	if amount <= 0 {
		return errors.New("refund amount must be positive")
	}
	
	if amount > (p.Amount - p.RefundedAmount) {
		return errors.New("refund amount exceeds available amount")
	}
	
	// Create refund record
	refund := &PaymentRefund{
		ID:        uuid.New(),
		PaymentID: p.ID,
		Amount:    amount,
		Reason:    reason,
		Status:    RefundStatusPending,
		CreatedAt: time.Now().UTC(),
	}
	
	p.Refunds = append(p.Refunds, *refund)
	p.RefundedAmount += amount
	
	// Update payment status
	if p.RefundedAmount >= p.Amount {
		p.Status = PaymentStatusRefunded
	} else {
		p.Status = PaymentStatusPartiallyRefunded
	}
	
	now := time.Now().UTC()
	p.RefundedAt = &now
	p.RefundReason = &reason
	p.UpdatedAt = now
	
	p.addEvent("payment_refunded", reason)
	
	return nil
}

func (p *Payment) SetPaymentIntentID(intentID string) {
	p.PaymentIntentID = &intentID
	p.UpdatedAt = time.Now().UTC()
}

func (p *Payment) SetProviderID(providerID string) {
	p.ProviderID = providerID
	p.UpdatedAt = time.Now().UTC()
}

func (p *Payment) SetCardDetails(last4, brand string, expMonth, expYear int) {
	p.CardLast4 = &last4
	p.CardBrand = &brand
	p.CardExpMonth = &expMonth
	p.CardExpYear = &expYear
	p.UpdatedAt = time.Now().UTC()
}

func (p *Payment) SetBillingAddress(address Address) {
	p.BillingAddress = &address
	p.UpdatedAt = time.Now().UTC()
}

func (p *Payment) SetDescription(description string) {
	p.Description = description
	p.UpdatedAt = time.Now().UTC()
}

func (p *Payment) AddMetadata(key string, value interface{}) {
	if p.Metadata == nil {
		p.Metadata = make(map[string]interface{})
	}
	p.Metadata[key] = value
	p.UpdatedAt = time.Now().UTC()
}

func (p *Payment) SetClientInfo(ipAddress, userAgent string) {
	p.IPAddress = &ipAddress
	p.UserAgent = &userAgent
	p.UpdatedAt = time.Now().UTC()
}

func (p *Payment) Expire() error {
	if p.Status != PaymentStatusPending {
		return errors.New("can only expire pending payments")
	}
	
	p.Status = PaymentStatusExpired
	p.UpdatedAt = time.Now().UTC()
	p.addEvent("payment_expired", "Payment expired")
	
	return nil
}

// Helper methods
func (p *Payment) IsExpired() bool {
	return p.ExpiresAt != nil && time.Now().UTC().After(*p.ExpiresAt)
}

func (p *Payment) IsCompleted() bool {
	return p.Status == PaymentStatusCompleted
}

func (p *Payment) IsFailed() bool {
	return p.Status == PaymentStatusFailed
}

func (p *Payment) IsCancelled() bool {
	return p.Status == PaymentStatusCancelled
}

func (p *Payment) IsRefunded() bool {
	return p.Status == PaymentStatusRefunded || p.Status == PaymentStatusPartiallyRefunded
}

func (p *Payment) CanBeRefunded() bool {
	return p.Status == PaymentStatusCompleted && p.RefundedAmount < p.Amount
}

func (p *Payment) RemainingAmount() float64 {
	return p.Amount - p.RefundedAmount
}

func (p *Payment) FormattedAmount() string {
	return formatMoney(p.Amount, p.Currency)
}

func (p *Payment) FormattedRefundedAmount() string {
	return formatMoney(p.RefundedAmount, p.Currency)
}

func (p *Payment) FormattedRemainingAmount() string {
	return formatMoney(p.RemainingAmount(), p.Currency)
}

func (p *Payment) HasCardDetails() bool {
	return p.CardLast4 != nil && p.CardBrand != nil
}

func (p *Payment) MaskedCardNumber() string {
	if p.CardLast4 == nil {
		return ""
	}
	return "**** **** **** " + *p.CardLast4
}

func (p *Payment) addEvent(eventType, description string) {
	event := PaymentEvent{
		ID:          uuid.New(),
		PaymentID:   p.ID,
		EventType:   eventType,
		Description: description,
		CreatedAt:   time.Now().UTC(),
	}
	p.Events = append(p.Events, event)
}

// Helper function for money formatting
func formatMoney(amount float64, currency string) string {
	switch currency {
	case "USD":
		return fmt.Sprintf("$%.2f", amount)
	case "EUR":
		return fmt.Sprintf("€%.2f", amount)
	case "GBP":
		return fmt.Sprintf("£%.2f", amount)
	case "THB":
		return fmt.Sprintf("฿%.2f", amount)
	default:
		return fmt.Sprintf("%s %.2f", currency, amount)
	}
}
