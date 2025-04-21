package models

import "time"

type Cat struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	Description string  `json:"description"`
	PhotoURL    string  `json:"photo_url"`
	LocationLat float64 `json:"location_lat"`
	LocationLng float64 `json:"location_lng"`
	Status      string  `json:"status"`
	UserID 		*uint 	`json:"user_id"`
	FedAt 		*time.Time `json:"fed_at"`
	TakenAt 	*time.Time `json:"taken_at"`
	Confirmed bool `json:"confirmed"`
	ConfirmPhotoURL string `json:"confirm_photo_url"`
	Approved bool `json:"approved"` // по умолчанию false
}