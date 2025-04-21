package middlewares

import (
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/basicauth"
)

// RegisterAdminAuth навешивает Basic‑Auth на /moderation.html и /moderate
func RegisterAdminAuth(app *fiber.App) {
	app.Use(basicauth.New(basicauth.Config{
		Authorizer: func(user, pass string) bool {
			return user == "admin" && pass == os.Getenv("ADMIN_PASSWORD")
		},
		Unauthorized: func(c *fiber.Ctx) error {
			c.Response().Header.Set("WWW-Authenticate",
				`Basic realm="WhereCat Admin"`)
			return c.Status(fiber.StatusUnauthorized).
				SendString("401 – Не авторизовано")
		},
		Next: func(c *fiber.Ctx) bool {
			// Защищаем только два пути
			p := c.Path()
			return !(p == "/moderation.html" || p == "/moderate")
		},
	}))
}
