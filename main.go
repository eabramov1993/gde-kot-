package main

import (
	"gde-kot/config"
	"gde-kot/routes"

	"gde-kot/middlewares"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
config.ConnectDatabase()
app:= fiber.New()
app.Use(cors.New()) 
routes.SetupCatRoutes(app)
middlewares.RegisterAdminAuth(app)

app.Static("/", "./public")
app.Listen("0.0.0.0:3000")
}