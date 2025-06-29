package entities

import (
	"time"

	"gorm.io/gorm"
)

// BaseEntity contains common fields for all entities
type BaseEntity struct {
	CreatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP;index" json:"created_at"`
	UpdatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	
	// Audit fields
	CreatedBy *string `gorm:"type:varchar(255)" json:"created_by,omitempty"`
	UpdatedBy *string `gorm:"type:varchar(255)" json:"updated_by,omitempty"`
	DeletedBy *string `gorm:"type:varchar(255)" json:"deleted_by,omitempty"`
	
	// Version for optimistic locking
	Version int `gorm:"default:1" json:"version"`
}

// BeforeCreate hook for BaseEntity
func (base *BaseEntity) BeforeCreate(tx *gorm.DB) error {
	now := time.Now()
	base.CreatedAt = now
	base.UpdatedAt = now
	base.Version = 1
	return nil
}

// BeforeUpdate hook for BaseEntity
func (base *BaseEntity) BeforeUpdate(tx *gorm.DB) error {
	base.UpdatedAt = time.Now()
	base.Version++
	return nil
}

// SoftDelete performs a soft delete
func (base *BaseEntity) SoftDelete(deletedBy *string) {
	now := time.Now()
	base.DeletedAt = gorm.DeletedAt{Time: now, Valid: true}
	base.DeletedBy = deletedBy
	base.UpdatedAt = now
}

// IsDeleted checks if the entity is soft deleted
func (base *BaseEntity) IsDeleted() bool {
	return base.DeletedAt.Valid
}

// Restore restores a soft deleted entity
func (base *BaseEntity) Restore() {
	base.DeletedAt = gorm.DeletedAt{}
	base.DeletedBy = nil
	base.UpdatedAt = time.Now()
}

// SetAuditInfo sets audit information
func (base *BaseEntity) SetAuditInfo(createdBy, updatedBy *string) {
	if base.CreatedBy == nil {
		base.CreatedBy = createdBy
	}
	base.UpdatedBy = updatedBy
}
