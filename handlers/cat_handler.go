package handlers

import (
	"fmt"
	"gde-kot/config"
	"gde-kot/models"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

func GetCats(c *fiber.Ctx) error {
	var cats []models.Cat
	result := config.DB.Where("approved = ?", true).Find(&cats)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка при получении котов"})
	}

	now := time.Now()

	for i := range cats {
		cat := &cats[i]

		if cat.Status == "fed" && cat.FedAt != nil {
			if now.Sub(*cat.FedAt) > 6*time.Hour {
				cat.Status = "hungry"
				cat.FedAt = nil
				config.DB.Save(cat)
			}
		}

		if (cat.Status == "taken" || cat.Status == "moving") && cat.TakenAt != nil && !cat.Confirmed {
			if now.Sub(*cat.TakenAt) > 3*time.Hour {
				cat.Status = "hungry"
				cat.TakenAt = nil
				config.DB.Save(cat)
			}
		}
	}

	return c.JSON(cats)
}

func CreateCat(c *fiber.Ctx) error {
	description := c.FormValue("description")
	status := c.FormValue("status")
	lat := c.FormValue("location_lat")
	lng := c.FormValue("location_lng")

	if status == "" || lat == "" || lng == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Отсутствуют обязательные поля"})
	}

	locationLat, err := strconv.ParseFloat(lat, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректная широта"})
	}
	locationLng, err := strconv.ParseFloat(lng, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Некорректная долгота"})
	}

	var photoURL string
	file, err := c.FormFile("photo")
	if err == nil && file != nil {
		uploadDir := "./uploads"
		os.MkdirAll(uploadDir, os.ModePerm)
		filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), file.Filename)
		filePath := filepath.Join(uploadDir, filename)

		if err := c.SaveFile(file, filePath); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Не удалось сохранить фото"})
		}
		photoURL = "/uploads/" + filename
	}

	cat := models.Cat{
		Description: description,
		Status:      status,
		LocationLat: locationLat,
		LocationLng: locationLng,
		PhotoURL:    photoURL,
		Approved:    false, // 🟡 На модерации
	}

	if cat.Status == "fed" {
		now := time.Now()
		cat.FedAt = &now
	}

	result := config.DB.Create(&cat)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Не удалось сохранить кота"})
	}

	return c.JSON(cat)
}

func UpdateCatStatus(c *fiber.Ctx) error {
	id := c.Params("id")

	var body struct {
		Status string `json:"status"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Невалидный JSON"})
	}

	var cat models.Cat
	result := config.DB.First(&cat, id)
	if result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Кот не найден"})
	}

	cat.Status = body.Status

	if body.Status == "fed" {
		now := time.Now()
		cat.FedAt = &now
	} else {
		cat.FedAt = nil
	}

	if body.Status == "moving" {
		now := time.Now()
		cat.TakenAt = &now
	} else if body.Status != "taken" {
		cat.TakenAt = nil
	}

	config.DB.Save(&cat)

	return c.JSON(cat)
}

func ConfirmCat(c *fiber.Ctx) error {
	id := c.Params("id")

	// 1) Сначала читаем кота из базы
	var cat models.Cat
	if err := config.DB.First(&cat, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Кот не найден"})
	}

	// 2) Проверяем, допустимо ли подтверждение
	if cat.Status != "moving" || cat.Confirmed {
		return c.Status(400).JSON(fiber.Map{"error": "Нельзя подтвердить этого кота"})
	}

	// 3) Обязательно фото‑доказательство
	file, err := c.FormFile("photo")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Фото обязательно"})
	}

	// 4) Сохраняем файл
	uploadDir := "./uploads"
	os.MkdirAll(uploadDir, os.ModePerm)

	filename := fmt.Sprintf("confirm_%d_%s", time.Now().UnixNano(), file.Filename)
	filePath := filepath.Join(uploadDir, filename)

	if err := c.SaveFile(file, filePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Не удалось сохранить фото"})
	}

	// 5) Обновляем запись: остаётся status = moving, confirmed = false
	cat.ConfirmPhotoURL = "/uploads/" + filename
	cat.Confirmed = false

	if err := config.DB.Save(&cat).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка сохранения кота"})
	}

	// 6) Возвращаем обновлённого кота
	return c.JSON(cat)
}


func ModerateCat(c *fiber.Ctx) error {
	id := c.Query("id")
	action := c.Query("action")

	var cat models.Cat
	if err := config.DB.First(&cat, id).Error; err != nil {
		return c.Status(404).SendString("Кот не найден")
	}

	switch action {
	case "approve":
		cat.Approved = true

	case "confirm":
		if cat.ConfirmPhotoURL == "" {
			return c.Status(400).SendString("Нет подтверждающего фото")
		}
		cat.Confirmed = true
		cat.Status = "taken"

	case "delete": // ← 🔥 новая ветка
		if err := config.DB.Delete(&cat).Error; err != nil {
			return c.Status(500).SendString("Ошибка удаления")
		}
		return c.SendString("OK")

	default:
		return c.Status(400).SendString("Неверное действие")
	}

	if err := config.DB.Save(&cat).Error; err != nil {
		return c.Status(500).SendString("Ошибка сохранения")
	}

	return c.SendString("OK")
}


func GetAllCats(c *fiber.Ctx) error {
	var cats []models.Cat
	result := config.DB.Find(&cats)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Ошибка при получении всех котов"})
	}
	return c.JSON(cats)
}
