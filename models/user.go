package models

type User struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	// в будущем можно добавить поле password, achievements и т.д.
}