package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HistoryEntry struct {
	DareID      uint   `json:"dare_id"`
	DareTitle   string `json:"dare_title"`
	Category    string `json:"category"`
	Difficulty  string `json:"difficulty"`
	Status      string `json:"status"`
	Points      int    `json:"points"`
	SubmittedAt string `json:"submitted_at"`
	MediaURL    string `json:"media_url"`
	VotesYes    int    `json:"votes_yes"`
	VotesNo     int    `json:"votes_no"`
}

type HistoryHandler struct {
	DB *gorm.DB
}

func NewHistoryHandler(db *gorm.DB) *HistoryHandler {
	return &HistoryHandler{DB: db}
}

// GET /api/me/history?status=approved&offset=0&limit=20
func (h *HistoryHandler) GetMyHistory(c *gin.Context) {
	userID := c.GetUint("user_id")
	status := c.Query("status")   // "approved", "rejected", "pending", "" = all
	offset := c.DefaultQuery("offset", "0")
	limit := c.DefaultQuery("limit", "20")

	query := h.DB.Table("submissions s").
		Select(`s.dare_id, d.title as dare_title, d.category, d.difficulty,
				s.status, s.points, s.created_at as submitted_at,
				s.media_url, s.votes_yes, s.votes_no`).
		Joins("JOIN dares d ON d.id = s.dare_id").
		Where("s.user_id = ?", userID).
		Order("s.created_at DESC")

	if status != "" {
		query = query.Where("s.status = ?", status)
	}

	var entries []HistoryEntry
	if err := query.Offset(atoi(offset)).Limit(atoi(limit)).Scan(&entries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch history"})
		return
	}

	var total int64
	countQ := h.DB.Table("submissions").Where("user_id = ?", userID)
	if status != "" {
		countQ = countQ.Where("status = ?", status)
	}
	countQ.Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"history": entries,
		"total":   total,
	})
}

func atoi(s string) int {
	n := 0
	for _, c := range s {
		if c >= '0' && c <= '9' {
			n = n*10 + int(c-'0')
		}
	}
	return n
}
