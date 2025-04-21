package config

import (
	"fmt"
	"gde-kot/models"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	fmt.Println("🔌 Подключаемся к БД...")

	dsn := os.Getenv("POSTGRES_DSN") // ✅ берём из переменной окружения
	if dsn == "" {
		log.Fatal("❌ POSTGRES_DSN не задан")
	}

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Ошибка подключения к базе:", err)
	}

	fmt.Println("✅ БД подключена, выполняем миграцию...")

	DB = database

	err = DB.AutoMigrate(&models.Cat{}, &models.User{})
	if err != nil {
		log.Fatal("❌ Ошибка миграции:", err)
	}

	fmt.Println("✅ Миграция завершена.")
}
