package routes

import (
	"gde-kot/handlers"

	"github.com/gofiber/fiber/v2"
)

func SetupCatRoutes(app *fiber.App) {
    app.Get("/cats", handlers.GetCats)
    app.Post("/cats", handlers.CreateCat)
	app.Patch("/cats/:id/status", handlers.UpdateCatStatus)
	app.Static("/uploads", "./uploads")
	app.Post("/cats/:id/confirm", handlers.ConfirmCat)
	app.Get("/moderate", handlers.ModerateCat)
	app.Get("/all-cats", handlers.GetAllCats) // если ещё не добавлен
}