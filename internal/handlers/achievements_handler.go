package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Badge definition
type BadgeDef struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Icon        string `json:"icon"`      // emoji or icon name
	Category    string `json:"category"`  // "dares" | "streak" | "social"
	Threshold   int    `json:"threshold"` // value needed to unlock
}

// Badge response with progress
type BadgeResponse struct {
	BadgeDef
	Unlocked bool `json:"unlocked"`
	Progress int  `json:"progress"` // current value
}

var allBadges = []BadgeDef{
	// ─── Dares completed ─────────────────────────
	{ID: "first_dare", Title: "Первый шаг", Description: "Выполни первый вызов", Icon: "🎯", Category: "dares", Threshold: 1},
	{ID: "dare_5", Title: "Начинающий", Description: "Выполни 5 вызовов", Icon: "⭐", Category: "dares", Threshold: 5},
	{ID: "dare_10", Title: "Опытный", Description: "Выполни 10 вызовов", Icon: "🔥", Category: "dares", Threshold: 10},
	{ID: "dare_25", Title: "Ветеран", Description: "Выполни 25 вызовов", Icon: "💪", Category: "dares", Threshold: 25},
	{ID: "dare_50", Title: "Легенда", Description: "Выполни 50 вызовов", Icon: "🏆", Category: "dares", Threshold: 50},
	{ID: "dare_100", Title: "Неудержимый", Description: "Выполни 100 вызовов", Icon: "👑", Category: "dares", Threshold: 100},

	// ─── Streak ──────────────────────────────────
	{ID: "streak_3", Title: "Разогрев", Description: "Стрик 3 дня", Icon: "🔥", Category: "streak", Threshold: 3},
	{ID: "streak_7", Title: "На волне", Description: "Стрик 7 дней", Icon: "🌊", Category: "streak", Threshold: 7},
	{ID: "streak_14", Title: "Двухнедельник", Description: "Стрик 14 дней", Icon: "⚡", Category: "streak", Threshold: 14},
	{ID: "streak_30", Title: "Машина", Description: "Стрик 30 дней", Icon: "🤖", Category: "streak", Threshold: 30},
	{ID: "streak_60", Title: "Железная воля", Description: "Стрик 60 дней", Icon: "🦾", Category: "streak", Threshold: 60},
	{ID: "streak_100", Title: "Сотка", Description: "Стрик 100 дней", Icon: "💯", Category: "streak", Threshold: 100},

	// ─── Social ──────────────────────────────────
	{ID: "ref_1", Title: "Дружище", Description: "Пригласи 1 друга", Icon: "🤝", Category: "social", Threshold: 1},
	{ID: "ref_5", Title: "Вербовщик", Description: "Пригласи 5 друзей", Icon: "📢", Category: "social", Threshold: 5},
	{ID: "ref_10", Title: "Амбассадор", Description: "Пригласи 10 друзей", Icon: "🌟", Category: "social", Threshold: 10},
}

type AchievementsHandler struct {
	DB *gorm.DB
}

func NewAchievementsHandler(db *gorm.DB) *AchievementsHandler {
	return &AchievementsHandler{DB: db}
}

func (h *AchievementsHandler) GetMyAchievements(c *gin.Context) {
	userID := c.GetUint("user_id")

	// Count approved submissions
	var daresCompleted int64
	h.DB.Table("submissions").
		Where("user_id = ? AND status = 'approved'", userID).
		Count(&daresCompleted)

	// Get current streak and max streak
	var user struct {
		Streak    int `gorm:"column:streak"`
		MaxStreak int `gorm:"column:max_streak"`
	}
	h.DB.Table("users").
		Select("streak, COALESCE(max_streak, streak) as max_streak").
		Where("id = ?", userID).
		Scan(&user)

	// Count referrals
	var referrals int64
	h.DB.Table("referrals").
		Where("referrer_id = ?", userID).
		Count(&referrals)

	// Build response
	badges := make([]BadgeResponse, 0, len(allBadges))
	unlockedCount := 0
	for _, b := range allBadges {
		var progress int
		switch b.Category {
		case "dares":
			progress = int(daresCompleted)
		case "streak":
			progress = user.MaxStreak
		case "social":
			progress = int(referrals)
		}

		unlocked := progress >= b.Threshold
		if unlocked {
			unlockedCount++
		}

		badges = append(badges, BadgeResponse{
			BadgeDef: b,
			Unlocked: unlocked,
			Progress: progress,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"badges":   badges,
		"total":    len(allBadges),
		"unlocked": unlockedCount,
	})
}
