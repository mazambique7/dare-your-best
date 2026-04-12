package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	webpush "github.com/SherClockHolmes/webpush-go"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/time/rate"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/gorilla/websocket"
)

// ═══════════════════════════════════════════════════════
//
//	MODELS
//
// ═══════════════════════════════════════════════════════
type User struct {
	ID             uint       `json:"id"              gorm:"primaryKey"`
	Username       string     `json:"username"        gorm:"uniqueIndex;size:30"`
	FirstName      string     `json:"first_name"`
	LastName       string     `json:"last_name"`
	Phone          string     `json:"phone"           gorm:"uniqueIndex;size:20"`
	Password       string     `json:"-"`
	City           string     `json:"city"            gorm:"size:100"`
	BirthDate      *time.Time `json:"birth_date"`
	Avatar         string     `json:"avatar"`
	Points         int        `json:"points"          gorm:"default:100"`
	Streak         int        `json:"streak"          gorm:"default:0"`
	MaxStreak      int        `json:"max_streak"      gorm:"default:0"`
	LastDoneAt     *time.Time `json:"last_done_at"`
	ProUntil       *time.Time `json:"pro_until"`
	Role           string     `json:"role"            gorm:"default:user"`
	ActiveDares    int        `json:"active_dares"    gorm:"default:0"`
	CompletedDares int        `json:"completed_dares" gorm:"default:0"`
	RefCode        string     `json:"ref_code"        gorm:"uniqueIndex;size:8"`
	RefBy          *uint      `json:"ref_by"`
	CreatedAt      time.Time  `json:"created_at"`
}

func (u User) IsPro() bool {
	return u.ProUntil != nil && u.ProUntil.After(time.Now())
}

// UserResponse добавляет вычисляемые поля поверх User
type UserResponse struct {
	User
	IsPro       bool `json:"is_pro"`
	LastDareDate string `json:"last_dare_date,omitempty"`
}

func toUserResponse(u User) UserResponse {
	r := UserResponse{User: u, IsPro: u.IsPro()}
	if u.LastDoneAt != nil {
		r.LastDareDate = u.LastDoneAt.Format("2006-01-02")
	}
	return r
}

type Dare struct {
	ID          uint       `json:"id"          gorm:"primaryKey"`
	AuthorID    uint       `json:"author_id"`
	Author      *User      `json:"author"      gorm:"foreignKey:AuthorID"`
	TakenBy     uint       `json:"taken_by"    gorm:"default:0"`
	Title       string     `json:"title"       gorm:"size:120"`
	Description string     `json:"description"`
	Category    string     `json:"category"    gorm:"size:50"`
	Difficulty  string     `json:"difficulty"  gorm:"size:10"`
	Reward      int        `json:"reward"`
	IsDaily     bool       `json:"is_daily"    gorm:"default:false"`
	Completed   bool       `json:"completed"   gorm:"default:false"`
	TakenAt     *time.Time `json:"taken_at"`
	ExpiresAt   *time.Time `json:"expires_at"`
	CreatedAt   time.Time  `json:"created_at"`
}

type Submission struct {
	ID        uint      `json:"id"         gorm:"primaryKey"`
	DareID    uint      `json:"dare_id"    gorm:"index"`
	UserID    uint      `json:"user_id"    gorm:"index"`
	User      *User     `json:"user"       gorm:"foreignKey:UserID"`
	Points    int       `json:"points"     gorm:"default:0"`
	MediaURL  string    `json:"media_url"`
	VotesYes  int       `json:"votes_yes"  gorm:"default:0"`
	VotesNo   int       `json:"votes_no"   gorm:"default:0"`
	Status    string    `json:"status"     gorm:"default:pending"`
	CreatedAt time.Time `json:"created_at"`
}

type Vote struct {
	ID           uint      `json:"id"            gorm:"primaryKey"`
	SubmissionID uint      `json:"submission_id" gorm:"index"`
	UserID       uint      `json:"user_id"       gorm:"index"`
	VoteType     string    `json:"vote_type"`
	CreatedAt    time.Time `json:"created_at"`
}

type Comment struct {
	ID           uint      `json:"id"            gorm:"primaryKey"`
	SubmissionID uint      `json:"submission_id" gorm:"index"`
	UserID       uint      `json:"user_id"       gorm:"index"`
	User         *User     `json:"user"          gorm:"foreignKey:UserID"`
	Text         string    `json:"text"`
	Likes        int       `json:"likes"         gorm:"default:0"`
	CreatedAt    time.Time `json:"created_at"`
}

type DailyDare struct {
	ID          uint      `json:"id"          gorm:"primaryKey"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Difficulty  string    `json:"difficulty"`
	Reward      int       `json:"reward"`
	ActiveDate  time.Time `json:"active_date" gorm:"uniqueIndex"`
	CreatedAt   time.Time `json:"created_at"`
}

type RefreshToken struct {
	ID        uint      `json:"id"         gorm:"primaryKey"`
	UserID    uint      `json:"user_id"    gorm:"index"`
	Token     string    `json:"token"      gorm:"uniqueIndex;size:64"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

type Referral struct {
	ID         uint      `json:"id"          gorm:"primaryKey"`
	ReferrerID uint      `json:"referrer_id" gorm:"index"`
	RefereeID  uint      `json:"referee_id"  gorm:"uniqueIndex"`
	BonusPaid  bool      `json:"bonus_paid"  gorm:"default:false"`
	CreatedAt  time.Time `json:"created_at"`
}

type PushSubscription struct {
	ID        uint      `json:"id"         gorm:"primaryKey"`
	UserID    uint      `json:"user_id"    gorm:"index"`
	Endpoint  string    `json:"endpoint"   gorm:"size:500"`
	P256dh    string    `json:"p256dh"`
	Auth      string    `json:"auth"`
	CreatedAt time.Time `json:"created_at"`
}

// ═══════════════════════════════════════════════════════
//
//	CONSTANTS & GLOBALS
//
// ═══════════════════════════════════════════════════════
const (
	FreeDareLimit   = 3
	FreeActiveLimit = 3
	ProActiveLimit  = 10
	VoteThreshold   = 3
	AvatarMaxSize   = 5 << 20
	MediaMaxSize    = 100 << 20
)

var (
	db        *gorm.DB
	jwtSecret []byte
	limiters  = make(map[uint]*rate.Limiter)
	wsHub     = newHub()
	dareReward = map[string]int{
		"easy": 100, "medium": 200, "hard": 300,
	}
	dareTTL = map[string]time.Duration{
		"easy": 24 * time.Hour, "medium": 48 * time.Hour, "hard": 72 * time.Hour,
	}
	darePenalty = map[string]float64{
		"easy": 0.2, "medium": 0.3, "hard": 0.5,
	}
)

// ═══════════════════════════════════════════════════════
//
//	MAIN
//
// ═══════════════════════════════════════════════════════
func main() {
	_ = godotenv.Load()

	jwtSecret = []byte(mustEnv("JWT_SECRET"))

	var err error
	db, err = gorm.Open(postgres.Open(mustEnv("DATABASE_URL")), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatal("DB:", err)
	}
	log.Println("✅ PostgreSQL connected")

	db.AutoMigrate(
		&User{}, &Dare{}, &Submission{}, &Vote{},
		&Comment{}, &DailyDare{}, &RefreshToken{},
		&Referral{}, &PushSubscription{},
	)
	os.MkdirAll("uploads", 0755)
	os.MkdirAll("avatars", 0755)

	r := gin.Default()
	r.MaxMultipartMemory = MediaMaxSize

	r.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Split(getEnv("ALLOWED_ORIGINS", "*"), ","),
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.Static("/uploads", "./uploads")
	r.Static("/avatars", "./avatars")

	// ── Public ──────────────────────────────────────────
	pub := r.Group("/api")
	pub.GET("/ping", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true, "app": "DareLoop"}) })
	pub.POST("/register", handleRegister)
	pub.POST("/login", handleLogin)
	pub.POST("/refresh", handleRefresh)
	pub.GET("/daily", handleGetDaily)
	pub.GET("/dares", handleListDares)
	pub.GET("/dares/:id", handleGetDare)
	pub.GET("/leaderboard", handleLeaderboard)
	pub.GET("/vapid-public-key", handleGetVAPIDPublicKey)

	// ── Authenticated ───────────────────────────────────
	a := r.Group("/api", needAuth())
	a.GET("/me", handleMe)
	a.PUT("/me", handleUpdateMe)
	// Поддерживаем оба роута для updateMe (фронт использует PUT /api/user)
	a.PUT("/user", handleUpdateMe)
	a.POST("/logout", handleLogout)
	// Загрузка аватара — два роута (старый и новый)
	a.POST("/avatar", handleUploadAvatar)
	a.POST("/upload-avatar", handleUploadAvatar)

	// Вызовы
	a.POST("/dares", rateLimit(), handleCreateDare)
	// Поддерживаем оба формата роутов
	a.POST("/dares/:id/accept", handleAcceptDare)
	a.POST("/accept/:id", handleAcceptDare)
	a.POST("/dares/:id/cancel", handleCancelDare)
	a.POST("/cancel/:id", handleCancelDare)
	a.POST("/dares/:id/submit", handleSubmitDare)
	a.POST("/submit/:id", handleSubmitDare)

	// Submissions
	a.GET("/dares/:id/submissions", handleGetSubmissions)
	a.POST("/submissions/:id/vote", handleVote)
	a.POST("/vote/:id", handleVote) // алиас для фронта

	// Комментарии
	a.GET("/submissions/:id/comments", handleGetComments)
	a.POST("/submissions/:id/comments", handleAddComment)

	// Профиль
	a.GET("/me/referrals", handleGetReferrals)
	a.GET("/me/achievements", handleGetAchievements)
	a.GET("/me/history", handleGetHistory)

	// Push-уведомления
	a.POST("/push/subscribe", handlePushSubscribe)
	a.POST("/push/unsubscribe", handlePushUnsubscribe)

	// ── Admin ───────────────────────────────────────────
	adm := r.Group("/api/admin", needAuth(), needAdmin())
	adm.POST("/daily", handleSetDaily)
	adm.DELETE("/dare/:id", handleAdminDeleteDare)
	adm.DELETE("/dares/:id", handleAdminDeleteDare)
	adm.POST("/ban/:id", handleBan)
	adm.POST("/unban/:id", handleUnban)
	adm.GET("/users", handleAdminListUsers)
	adm.POST("/reset-votes/:id", handleResetVotes)

	// WebSocket
	r.GET("/ws", handleWebSocket)

	go wsHub.run()
	go expiredDaresWorker()
	go streakReminderWorker()

	port := getEnv("PORT", "8080")
	log.Printf("🚀 DareLoop API :%s", port)
	r.Run(":" + port)
}

// ═══════════════════════════════════════════════════════
//
//	AUTH
//
// ═══════════════════════════════════════════════════════
func handleRegister(c *gin.Context) {
	var in struct {
		Username  string `json:"username"   binding:"required,min=3,max=30"`
		FirstName string `json:"first_name" binding:"required"`
		LastName  string `json:"last_name"  binding:"required"`
		Phone     string `json:"phone"      binding:"required"`
		Password  string `json:"password"   binding:"required,min=6"`
		City      string `json:"city"`
		BirthDate string `json:"birth_date"`
		RefCode   string `json:"ref_code"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		fail(c, 400, "Заполните все обязательные поля")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), 12)
	if err != nil {
		fail(c, 500, "Ошибка сервера")
		return
	}

	trial := time.Now().Add(72 * time.Hour)
	u := User{
		Username:  in.Username,
		FirstName: in.FirstName,
		LastName:  in.LastName,
		Phone:     in.Phone,
		Password:  string(hash),
		City:      in.City,
		ProUntil:  &trial,
		Role:      "user",
		RefCode:   newRefCode(),
	}

	if in.BirthDate != "" {
		if t, err := time.Parse("2006-01-02", in.BirthDate); err == nil {
			u.BirthDate = &t
		}
	}

	if in.RefCode != "" {
		var ref User
		if db.Where("ref_code = ?", in.RefCode).First(&ref).Error == nil {
			u.RefBy = &ref.ID
		}
	}

	if err := db.Create(&u).Error; err != nil {
		fail(c, 400, "Телефон или никнейм уже заняты")
		return
	}

	// Начислить бонус рефереру после создания пользователя
	if u.RefBy != nil {
		var ref User
		if db.First(&ref, *u.RefBy).Error == nil {
			db.Model(&ref).UpdateColumn("points", ref.Points+200)
			db.Create(&Referral{ReferrerID: ref.ID, RefereeID: u.ID})
		}
	}

	// Начислить новому пользователю бонус за использование реф-кода
	if u.RefBy != nil {
		db.Model(&u).UpdateColumn("points", u.Points+100)
	}

	at, rt, err := newTokenPair(u.ID)
	if err != nil {
		fail(c, 500, "Ошибка токена")
		return
	}

	// Обновить объект пользователя из БД
	db.First(&u, u.ID)
	c.JSON(201, gin.H{"access_token": at, "refresh_token": rt, "user": toUserResponse(u)})
}

func handleLogin(c *gin.Context) {
	var in struct {
		Username string `json:"username"`
		Phone    string `json:"phone"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		fail(c, 400, err.Error())
		return
	}

	var u User
	// Поддерживаем вход по username или phone
	if in.Username != "" {
		if db.Where("username = ?", in.Username).First(&u).Error != nil {
			fail(c, 401, "Неверный логин или пароль")
			return
		}
	} else if in.Phone != "" {
		if db.Where("phone = ?", in.Phone).First(&u).Error != nil {
			fail(c, 401, "Неверный телефон или пароль")
			return
		}
	} else {
		fail(c, 400, "Укажите username или phone")
		return
	}

	if u.Role == "banned" {
		fail(c, 403, "Аккаунт заблокирован")
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(in.Password)) != nil {
		fail(c, 401, "Неверный логин или пароль")
		return
	}
	at, rt, err := newTokenPair(u.ID)
	if err != nil {
		fail(c, 500, "Ошибка токена")
		return
	}
	c.JSON(200, gin.H{"access_token": at, "refresh_token": rt, "user": toUserResponse(u)})
}

func handleRefresh(c *gin.Context) {
	var in struct {
		Token string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		fail(c, 400, err.Error())
		return
	}
	var rt RefreshToken
	if db.Where("token = ? AND expires_at > ?", in.Token, time.Now()).First(&rt).Error != nil {
		fail(c, 401, "Токен недействителен")
		return
	}
	db.Delete(&rt)
	at, newRT, err := newTokenPair(rt.UserID)
	if err != nil {
		fail(c, 500, "Ошибка токена")
		return
	}
	c.JSON(200, gin.H{"access_token": at, "refresh_token": newRT})
}

func handleLogout(c *gin.Context) {
	var in struct {
		Token string `json:"refresh_token"`
	}
	c.ShouldBindJSON(&in)
	if in.Token != "" {
		db.Where("token = ?", in.Token).Delete(&RefreshToken{})
	}
	c.JSON(200, gin.H{"ok": true})
}

// ═══════════════════════════════════════════════════════
//
//	USER
//
// ═══════════════════════════════════════════════════════
func handleMe(c *gin.Context) {
	u := mustUser(c)
	// Подгрузить свежие данные
	db.First(&u, u.ID)
	c.JSON(200, toUserResponse(u))
}

func handleUpdateMe(c *gin.Context) {
	u := mustUser(c)
	var in struct {
		Username        string `json:"username"`
		FirstName       string `json:"first_name"`
		LastName        string `json:"last_name"`
		City            string `json:"city"`
		Phone           string `json:"phone"`
		BirthDate       string `json:"birth_date"`
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		fail(c, 400, err.Error())
		return
	}
	upd := map[string]any{}
	if s := in.Username; s != "" && s != u.Username {
		var x User
		if db.Where("username = ? AND id != ?", s, u.ID).First(&x).Error == nil {
			fail(c, 400, "Никнейм занят")
			return
		}
		upd["username"] = s
	}
	if s := in.FirstName; s != "" {
		upd["first_name"] = s
	}
	if s := in.LastName; s != "" {
		upd["last_name"] = s
	}
	if s := in.City; s != "" {
		upd["city"] = s
	}
	if s := in.Phone; s != "" && s != u.Phone {
		var x User
		if db.Where("phone = ? AND id != ?", s, u.ID).First(&x).Error == nil {
			fail(c, 400, "Телефон занят")
			return
		}
		upd["phone"] = s
	}
	if s := in.BirthDate; s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			upd["birth_date"] = t
		}
	}
	if in.NewPassword != "" {
		if in.CurrentPassword == "" {
			fail(c, 400, "Введите текущий пароль")
			return
		}
		if bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(in.CurrentPassword)) != nil {
			fail(c, 401, "Неверный текущий пароль")
			return
		}
		if len(in.NewPassword) < 6 {
			fail(c, 400, "Пароль минимум 6 символов")
			return
		}
		h, _ := bcrypt.GenerateFromPassword([]byte(in.NewPassword), 12)
		upd["password"] = string(h)
	}
	if len(upd) > 0 {
		db.Model(&u).Updates(upd)
	}
	db.First(&u, u.ID)
	c.JSON(200, toUserResponse(u))
}

func handleUploadAvatar(c *gin.Context) {
	u := mustUser(c)
	f, err := c.FormFile("avatar")
	if err != nil {
		fail(c, 400, "Файл не получен")
		return
	}
	if f.Size > AvatarMaxSize {
		fail(c, 400, "Максимум 5 МБ")
		return
	}
	src, _ := f.Open()
	buf := make([]byte, 512)
	src.Read(buf)
	src.Close()
	mime := sniffMIME(buf)
	if mime != "image/jpeg" && mime != "image/png" && mime != "image/gif" {
		fail(c, 400, "Только jpg/png/gif")
		return
	}
	ext := filepath.Ext(f.Filename)
	name := fmt.Sprintf("%d_%d%s", u.ID, time.Now().UnixNano(), ext)
	if err := c.SaveUploadedFile(f, "avatars/"+name); err != nil {
		fail(c, 500, "Ошибка сохранения")
		return
	}
	url := "/avatars/" + name
	db.Model(&u).UpdateColumn("avatar", url)
	c.JSON(200, gin.H{"avatar": url})
}

// ═══════════════════════════════════════════════════════
//
//	DARES
//
// ═══════════════════════════════════════════════════════
func handleGetDaily(c *gin.Context) {
	today := time.Now().Truncate(24 * time.Hour)
	var d DailyDare
	if db.Where("active_date = ?", today).First(&d).Error != nil {
		fail(c, 404, "Вызов дня не установлен")
		return
	}
	if d.Reward == 0 {
		d.Reward = dareReward[d.Difficulty]
	}
	remaining := int(time.Until(today.Add(24 * time.Hour)).Seconds())
	c.JSON(200, gin.H{"dare": d, "remaining_secs": remaining})
}

func handleListDares(c *gin.Context) {
	q := db.Preload("Author").Where("taken_by = 0 AND completed = false")
	if v := c.Query("category"); v != "" {
		q = q.Where("category = ?", v)
	}
	if v := c.Query("difficulty"); v != "" {
		q = q.Where("difficulty = ?", v)
	}
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > 50 {
		limit = 50
	}

	var dares []Dare
	q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&dares)

	// Добавить reward если не задан
	for i := range dares {
		if dares[i].Reward == 0 {
			dares[i].Reward = dareReward[dares[i].Difficulty]
		}
	}

	// Фронт ждёт массив, не объект
	c.JSON(200, dares)
}

func handleGetDare(c *gin.Context) {
	id := paramUint(c, "id")
	var d Dare
	if db.Preload("Author").First(&d, id).Error != nil {
		fail(c, 404, "Вызов не найден")
		return
	}
	if d.Reward == 0 {
		d.Reward = dareReward[d.Difficulty]
	}
	c.JSON(200, d)
}

func handleCreateDare(c *gin.Context) {
	u := mustUser(c)
	var in struct {
		Title       string `json:"title"       binding:"required,min=5,max=120"`
		Description string `json:"description" binding:"required,min=10"`
		Category    string `json:"category"    binding:"required"`
		Difficulty  string `json:"difficulty"  binding:"required"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		fail(c, 400, "Название ≥5, описание ≥10 символов")
		return
	}
	reward, ok := dareReward[in.Difficulty]
	if !ok {
		fail(c, 400, "Сложность: easy | medium | hard")
		return
	}
	if in.Difficulty == "hard" && !u.IsPro() {
		fail(c, 403, "Hard-вызовы только для Pro")
		return
	}
	if !u.IsPro() {
		var cnt int64
		db.Model(&Dare{}).Where(
			"author_id = ? AND created_at >= ?",
			u.ID, time.Now().Truncate(24*time.Hour),
		).Count(&cnt)
		if int(cnt) >= FreeDareLimit {
			fail(c, 429, fmt.Sprintf("Дневной лимит: %d вызовов", FreeDareLimit))
			return
		}
	}
	d := Dare{
		AuthorID:    u.ID,
		Title:       in.Title,
		Description: in.Description,
		Category:    in.Category,
		Difficulty:  in.Difficulty,
		Reward:      reward,
	}
	db.Create(&d)
	db.Preload("Author").First(&d, d.ID)
	c.JSON(201, d)
}

func handleAcceptDare(c *gin.Context) {
	u := mustUser(c)
	id := paramUint(c, "id")

	limit := FreeActiveLimit
	if u.IsPro() {
		limit = ProActiveLimit
	}
	if u.ActiveDares >= limit {
		fail(c, 429, fmt.Sprintf("Лимит активных вызовов: %d", limit))
		return
	}
	var d Dare
	if db.First(&d, id).Error != nil {
		fail(c, 404, "Вызов не найден")
		return
	}
	if d.TakenBy != 0 {
		fail(c, 409, "Вызов уже занят")
		return
	}
	if d.AuthorID == u.ID {
		fail(c, 400, "Нельзя принять свой вызов")
		return
	}
	now := time.Now()
	exp := now.Add(dareTTL[d.Difficulty])
	db.Model(&d).Updates(map[string]any{"taken_by": u.ID, "taken_at": now, "expires_at": exp})
	db.Model(&u).UpdateColumn("active_dares", u.ActiveDares+1)
	db.Preload("Author").First(&d, d.ID)
	// Push notification to dare author
	triggerPushOnDareAccepted(&d, &u)
	c.JSON(200, d)
}

func handleCancelDare(c *gin.Context) {
	u := mustUser(c)
	id := paramUint(c, "id")
	var d Dare
	if db.First(&d, id).Error != nil {
		fail(c, 404, "Вызов не найден")
		return
	}
	if d.TakenBy != u.ID {
		fail(c, 403, "Это не ваш вызов")
		return
	}
	penalty := 0
	if d.TakenAt != nil && time.Since(*d.TakenAt) > 30*time.Minute {
		penalty = int(float64(d.Reward) * darePenalty[d.Difficulty])
		pts := u.Points - penalty
		if pts < 0 {
			pts = 0
		}
		db.Model(&u).UpdateColumn("points", pts)
		if d.Difficulty == "hard" {
			db.Model(&u).UpdateColumn("streak", 0)
		}
	}
	active := u.ActiveDares - 1
	if active < 0 {
		active = 0
	}
	db.Model(&u).UpdateColumn("active_dares", active)
	db.Model(&d).Updates(map[string]any{"taken_by": 0, "taken_at": nil, "expires_at": nil})
	c.JSON(200, gin.H{"message": "Отменён", "penalty": penalty})
}

func handleSubmitDare(c *gin.Context) {
	u := mustUser(c)
	id := paramUint(c, "id")
	var d Dare
	if db.First(&d, id).Error != nil {
		fail(c, 404, "Вызов не найден")
		return
	}
	if d.TakenBy != u.ID {
		fail(c, 403, "Вы не принимали этот вызов")
		return
	}
	if d.Completed {
		fail(c, 400, "Вызов уже выполнен")
		return
	}
	var ex Submission
	if db.Where("dare_id = ? AND user_id = ?", id, u.ID).First(&ex).Error == nil {
		fail(c, 400, "Видео уже загружено")
		return
	}
	f, err := c.FormFile("media")
	if err != nil {
		fail(c, 400, "Медиафайл обязателен")
		return
	}
	if f.Size > MediaMaxSize {
		fail(c, 400, "Максимум 100 МБ")
		return
	}
	src, _ := f.Open()
	buf := make([]byte, 512)
	src.Read(buf)
	src.Close()
	mime := sniffMIME(buf)
	okMIME := map[string]bool{
		"image/jpeg":      true,
		"image/png":       true,
		"video/mp4":       true,
		"video/quicktime": true,
	}
	if !okMIME[mime] {
		fail(c, 400, "Только mp4/mov/jpg/png")
		return
	}
	ext := filepath.Ext(f.Filename)
	name := fmt.Sprintf("%d_%d_%d%s", u.ID, id, time.Now().UnixNano(), ext)
	if err := c.SaveUploadedFile(f, "uploads/"+name); err != nil {
		fail(c, 500, "Ошибка сохранения")
		return
	}
	sub := Submission{
		DareID:   id,
		UserID:   u.ID,
		MediaURL: "/uploads/" + name,
		Status:   "pending",
		Points:   d.Reward,
	}
	db.Create(&sub)
	db.Preload("User").First(&sub, sub.ID)
	c.JSON(201, sub)
}

// ═══════════════════════════════════════════════════════
//
//	SUBMISSIONS
//
// ═══════════════════════════════════════════════════════
func handleGetSubmissions(c *gin.Context) {
	dareID := paramUint(c, "id")
	var subs []Submission
	db.Preload("User").Where("dare_id = ?", dareID).Order("created_at DESC").Find(&subs)
	c.JSON(200, subs)
}

// ═══════════════════════════════════════════════════════
//
//	COMMENTS
//
// ═══════════════════════════════════════════════════════
func handleGetComments(c *gin.Context) {
	submissionID := paramUint(c, "id")
	var comments []Comment
	db.Preload("User").Where("submission_id = ?", submissionID).Order("created_at ASC").Find(&comments)
	c.JSON(200, comments)
}

func handleAddComment(c *gin.Context) {
	u := mustUser(c)
	submissionID := paramUint(c, "id")

	var sub Submission
	if db.First(&sub, submissionID).Error != nil {
		fail(c, 404, "Заявка не найдена")
		return
	}

	var in struct {
		Text string `json:"text" binding:"required,min=1,max=500"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		fail(c, 400, "Текст комментария обязателен")
		return
	}

	comment := Comment{
		SubmissionID: submissionID,
		UserID:       u.ID,
		Text:         in.Text,
	}
	db.Create(&comment)
	db.Preload("User").First(&comment, comment.ID)
	// Broadcast real-time update
	var parentSub Submission
	db.First(&parentSub, submissionID)
	room := fmt.Sprintf("dare:%d", parentSub.DareID)
	wsHub.broadcastToRoom(room, "comment", comment)
	// Push notification to submission owner
	var commentDare Dare
	db.First(&commentDare, parentSub.DareID)
	triggerPushOnNewComment(&parentSub, &u, &commentDare)
	c.JSON(201, comment)
}

// ═══════════════════════════════════════════════════════
//
//	VOTE
//
// ═══════════════════════════════════════════════════════
func handleVote(c *gin.Context) {
	u := mustUser(c)
	id := paramUint(c, "id")
	var in struct {
		VoteType string `json:"vote_type"`
		Vote     string `json:"vote"`
	}
	c.ShouldBindJSON(&in)

	// Поддерживаем оба поля: vote_type и vote
	voteType := in.VoteType
	if voteType == "" {
		voteType = in.Vote
	}
	if voteType != "yes" && voteType != "no" {
		fail(c, 400, "vote_type: yes | no")
		return
	}

	var sub Submission
	if db.First(&sub, id).Error != nil {
		fail(c, 404, "Заявка не найдена")
		return
	}
	if sub.UserID == u.ID {
		fail(c, 400, "Нельзя голосовать за себя")
		return
	}
	if sub.Status != "pending" {
		fail(c, 400, "Голосование завершено")
		return
	}
	var ex Vote
	if db.Where("submission_id = ? AND user_id = ?", id, u.ID).First(&ex).Error == nil {
		fail(c, 400, "Вы уже проголосовали")
		return
	}
	db.Create(&Vote{SubmissionID: id, UserID: u.ID, VoteType: voteType})
	if voteType == "yes" {
		db.Model(&sub).UpdateColumn("votes_yes", sub.VotesYes+1)
		sub.VotesYes++
	} else {
		db.Model(&sub).UpdateColumn("votes_no", sub.VotesNo+1)
		sub.VotesNo++
	}
	total := sub.VotesYes + sub.VotesNo
	if total >= VoteThreshold && sub.VotesYes > sub.VotesNo {
		approveSubmission(&sub)
	} else if total >= VoteThreshold*3 && sub.VotesNo >= sub.VotesYes*2 {
		db.Model(&sub).UpdateColumn("status", "rejected")
		// Push notification — rejected
		var rejectDare Dare
		db.First(&rejectDare, sub.DareID)
		triggerPushOnVoteRejected(&sub, &rejectDare)
	}
	db.First(&sub, id)
	// Broadcast real-time update
	room := fmt.Sprintf("dare:%d", sub.DareID)
	wsHub.broadcastToRoom(room, "vote", sub)
	c.JSON(200, sub)
}

func approveSubmission(sub *Submission) {
	db.Model(sub).Updates(map[string]any{"status": "approved"})
	// Broadcast dare_status change
	room := fmt.Sprintf("dare:%d", sub.DareID)
	wsHub.broadcastToRoom(room, "dare_status", gin.H{"dare_id": sub.DareID, "status": "approved"})
	// Push notification to performer
	var d Dare
	db.First(&d, sub.DareID)
	triggerPushOnVoteApproved(sub, &d)
	var d Dare
	db.First(&d, sub.DareID)
	db.Model(&d).UpdateColumn("completed", true)
	var performer User
	db.First(&performer, sub.UserID)
	streak := calcStreak(performer)
	maxStreak := performer.MaxStreak
	if streak > maxStreak {
		maxStreak = streak
	}
	active := performer.ActiveDares - 1
	if active < 0 {
		active = 0
	}
	now := time.Now()
	db.Model(&performer).Updates(map[string]any{
		"points":          performer.Points + d.Reward,
		"streak":          streak,
		"max_streak":      maxStreak,
		"active_dares":    active,
		"completed_dares": performer.CompletedDares + 1,
		"last_done_at":    now,
	})

	// Начислить реферальный бонус за первый выполненный вызов
	if performer.CompletedDares == 0 && performer.RefBy != nil {
		var ref User
		if db.First(&ref, *performer.RefBy).Error == nil {
			db.Model(&ref).UpdateColumn("points", ref.Points+100)
			db.Model(&Referral{}).Where("referrer_id = ? AND referee_id = ?", ref.ID, performer.ID).
				UpdateColumn("bonus_paid", true)
		}
	}
}

// ═══════════════════════════════════════════════════════
//
//	LEADERBOARD
//
// ═══════════════════════════════════════════════════════
func handleLeaderboard(c *gin.Context) {
	q := db.Model(&User{}).Where("role NOT IN ?", []string{"banned"})
	if city := c.Query("city"); city != "" {
		q = q.Where("city = ?", city)
	}
	if c.Query("period") == "week" {
		q = q.Order("streak DESC, points DESC")
	} else {
		q = q.Order("points DESC")
	}
	var rows []struct {
		ID        uint   `json:"id"`
		Username  string `json:"username"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		City      string `json:"city"`
		Avatar    string `json:"avatar"`
		Points    int    `json:"points"`
		Streak    int    `json:"streak"`
	}
	q.Limit(50).Scan(&rows)
	// Фронт ждёт массив
	c.JSON(200, rows)
}

// ═══════════════════════════════════════════════════════
//
//	REFERRALS
//
// ═══════════════════════════════════════════════════════
func handleGetReferrals(c *gin.Context) {
	u := mustUser(c)

	type RefEntry struct {
		ID        uint      `json:"id"`
		Username  string    `json:"username"`
		Avatar    string    `json:"avatar"`
		Points    int       `json:"points"`
		JoinedAt  time.Time `json:"joined_at"`
		BonusPaid bool      `json:"bonus_paid"`
	}

	var referrals []struct {
		ReferralID uint
		UserID     uint
		Username   string
		Avatar     string
		Points     int
		CreatedAt  time.Time
		BonusPaid  bool
	}

	db.Table("referrals r").
		Select("r.id as referral_id, u.id as user_id, u.username, u.avatar, u.points, r.created_at, r.bonus_paid").
		Joins("JOIN users u ON u.id = r.referee_id").
		Where("r.referrer_id = ?", u.ID).
		Order("r.created_at DESC").
		Scan(&referrals)

	entries := make([]RefEntry, 0, len(referrals))
	totalEarned := 200 * len(referrals) // базовый бонус
	for _, r := range referrals {
		entries = append(entries, RefEntry{
			ID:        r.ReferralID,
			Username:  r.Username,
			Avatar:    r.Avatar,
			Points:    r.Points,
			JoinedAt:  r.CreatedAt,
			BonusPaid: r.BonusPaid,
		})
		if r.BonusPaid {
			totalEarned += 100
		}
	}

	shareURL := fmt.Sprintf("https://dareloop.ru/join?ref=%s", u.RefCode)
	c.JSON(200, gin.H{
		"total_referrals": len(referrals),
		"total_earned":    totalEarned,
		"ref_code":        u.RefCode,
		"share_url":       shareURL,
		"referrals":       entries,
	})
}

// ═══════════════════════════════════════════════════════
//
//	ACHIEVEMENTS
//
// ═══════════════════════════════════════════════════════
type BadgeDef struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Category    string `json:"category"`
	Threshold   int    `json:"threshold"`
}

type BadgeResponse struct {
	BadgeDef
	Unlocked bool `json:"unlocked"`
	Progress int  `json:"progress"`
}

var allBadges = []BadgeDef{
	// Вызовы
	{ID: "first_dare", Title: "Первый шаг", Description: "Выполни первый вызов", Icon: "🎯", Category: "dares", Threshold: 1},
	{ID: "dare_5", Title: "Начинающий", Description: "Выполни 5 вызовов", Icon: "⭐", Category: "dares", Threshold: 5},
	{ID: "dare_10", Title: "Опытный", Description: "Выполни 10 вызовов", Icon: "🔥", Category: "dares", Threshold: 10},
	{ID: "dare_25", Title: "Ветеран", Description: "Выполни 25 вызовов", Icon: "💪", Category: "dares", Threshold: 25},
	{ID: "dare_50", Title: "Легенда", Description: "Выполни 50 вызовов", Icon: "🏆", Category: "dares", Threshold: 50},
	{ID: "dare_100", Title: "Неудержимый", Description: "Выполни 100 вызовов", Icon: "👑", Category: "dares", Threshold: 100},
	// Стрик
	{ID: "streak_3", Title: "Разогрев", Description: "Стрик 3 дня", Icon: "🔥", Category: "streak", Threshold: 3},
	{ID: "streak_7", Title: "На волне", Description: "Стрик 7 дней", Icon: "🌊", Category: "streak", Threshold: 7},
	{ID: "streak_14", Title: "Двухнедельник", Description: "Стрик 14 дней", Icon: "⚡", Category: "streak", Threshold: 14},
	{ID: "streak_30", Title: "Машина", Description: "Стрик 30 дней", Icon: "🤖", Category: "streak", Threshold: 30},
	{ID: "streak_60", Title: "Железная воля", Description: "Стрик 60 дней", Icon: "🦾", Category: "streak", Threshold: 60},
	{ID: "streak_100", Title: "Сотка", Description: "Стрик 100 дней", Icon: "💯", Category: "streak", Threshold: 100},
	// Социальное
	{ID: "ref_1", Title: "Дружище", Description: "Пригласи 1 друга", Icon: "🤝", Category: "social", Threshold: 1},
	{ID: "ref_5", Title: "Вербовщик", Description: "Пригласи 5 друзей", Icon: "📢", Category: "social", Threshold: 5},
	{ID: "ref_10", Title: "Амбассадор", Description: "Пригласи 10 друзей", Icon: "🌟", Category: "social", Threshold: 10},
}

func handleGetAchievements(c *gin.Context) {
	u := mustUser(c)

	var daresCompleted int64
	db.Model(&Submission{}).Where("user_id = ? AND status = 'approved'", u.ID).Count(&daresCompleted)

	var userData struct {
		Streak    int
		MaxStreak int
	}
	db.Table("users").Select("streak, COALESCE(max_streak, streak) as max_streak").Where("id = ?", u.ID).Scan(&userData)

	var referrals int64
	db.Model(&Referral{}).Where("referrer_id = ?", u.ID).Count(&referrals)

	badges := make([]BadgeResponse, 0, len(allBadges))
	unlockedCount := 0
	for _, b := range allBadges {
		var progress int
		switch b.Category {
		case "dares":
			progress = int(daresCompleted)
		case "streak":
			progress = userData.MaxStreak
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

	c.JSON(200, gin.H{
		"badges":   badges,
		"total":    len(allBadges),
		"unlocked": unlockedCount,
	})
}

// ═══════════════════════════════════════════════════════
//
//	HISTORY
//
// ═══════════════════════════════════════════════════════
func handleGetHistory(c *gin.Context) {
	u := mustUser(c)
	status := c.Query("status")
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	type HistoryEntry struct {
		DareID      uint      `json:"dare_id"`
		DareTitle   string    `json:"dare_title"`
		Category    string    `json:"category"`
		Difficulty  string    `json:"difficulty"`
		Status      string    `json:"status"`
		Points      int       `json:"points"`
		SubmittedAt time.Time `json:"submitted_at"`
		MediaURL    string    `json:"media_url"`
		VotesYes    int       `json:"votes_yes"`
		VotesNo     int       `json:"votes_no"`
	}

	query := db.Table("submissions s").
		Select(`s.dare_id, d.title as dare_title, d.category, d.difficulty,
				s.status, s.points, s.created_at as submitted_at,
				s.media_url, s.votes_yes, s.votes_no`).
		Joins("JOIN dares d ON d.id = s.dare_id").
		Where("s.user_id = ?", u.ID).
		Order("s.created_at DESC")

	if status != "" {
		query = query.Where("s.status = ?", status)
	}

	var entries []HistoryEntry
	query.Offset(offset).Limit(limit).Scan(&entries)

	var total int64
	countQ := db.Table("submissions").Where("user_id = ?", u.ID)
	if status != "" {
		countQ = countQ.Where("status = ?", status)
	}
	countQ.Count(&total)

	c.JSON(200, gin.H{
		"history": entries,
		"total":   total,
	})
}

// ═══════════════════════════════════════════════════════
//
//	PUSH NOTIFICATIONS
//
// ═══════════════════════════════════════════════════════

// handleGetVAPIDPublicKey — фронт запрашивает публичный ключ при подписке
func handleGetVAPIDPublicKey(c *gin.Context) {
	pub := getEnv("VAPID_PUBLIC_KEY", "")
	if pub == "" {
		fail(c, 503, "Push-уведомления не настроены")
		return
	}
	c.JSON(200, gin.H{"public_key": pub})
}

// sendPushToUser отправляет уведомление всем устройствам пользователя.
// Вызывается из любого места бэкенда.
func sendPushToUser(userID uint, title, body, targetURL string) {
	privKey := getEnv("VAPID_PRIVATE_KEY", "")
	pubKey := getEnv("VAPID_PUBLIC_KEY", "")
	subject := getEnv("VAPID_SUBJECT", "mailto:admin@dareloop.ru")

	if privKey == "" || pubKey == "" {
		return // push не настроен
	}

	var subs []PushSubscription
	db.Where("user_id = ?", userID).Find(&subs)
	if len(subs) == 0 {
		return
	}

	payload, _ := json.Marshal(map[string]any{
		"title": title,
		"body":  body,
		"url":   targetURL,
		"tag":   "dareloop",
		"icon":  "/icon-192.png",
	})

	for _, sub := range subs {
		go func(s PushSubscription) {
			subscription := &webpush.Subscription{
				Endpoint: s.Endpoint,
				Keys: webpush.Keys{
					P256dh: s.P256dh,
					Auth:   s.Auth,
				},
			}

			resp, err := webpush.SendNotification(payload, subscription, &webpush.Options{
				VAPIDPublicKey:  pubKey,
				VAPIDPrivateKey: privKey,
				Subscriber:      subject,
				TTL:             86400,
				Urgency:         webpush.UrgencyNormal,
			})
			if err != nil {
				log.Printf("⚠️  Push failed user#%d: %v", userID, err)
				return
			}
			defer resp.Body.Close()

			// 404/410 = подписка устарела, удаляем
			if resp.StatusCode == 404 || resp.StatusCode == 410 {
				db.Delete(&s)
				log.Printf("🗑  Removed stale push subscription user#%d", userID)
			}
		}(sub)
	}
}

// ═══════════════════════════════════════════════════════
//
//	PUSH TRIGGERS — когда и кому отправляем
//
// ═══════════════════════════════════════════════════════

// triggerPushOnVoteApproved — вызов засчитан, уведомить исполнителя
func triggerPushOnVoteApproved(sub *Submission, dare *Dare) {
	go sendPushToUser(
		sub.UserID,
		"🏆 Вызов засчитан!",
		fmt.Sprintf("«%s» — тебе начислено +%d очков", dare.Title, dare.Reward),
		fmt.Sprintf("/dare/%d", dare.ID),
	)
}

// triggerPushOnVoteRejected — вызов не засчитан
func triggerPushOnVoteRejected(sub *Submission, dare *Dare) {
	go sendPushToUser(
		sub.UserID,
		"😔 Вызов не засчитан",
		fmt.Sprintf("«%s» — не набрал достаточно голосов", dare.Title),
		fmt.Sprintf("/dare/%d", dare.ID),
	)
}

// triggerPushOnNewComment — новый комментарий к твоему видео
func triggerPushOnNewComment(submission *Submission, commenter *User, dare *Dare) {
	if submission.UserID == commenter.ID {
		return // не уведомлять о своём комментарии
	}
	go sendPushToUser(
		submission.UserID,
		"💬 Новый комментарий",
		fmt.Sprintf("@%s прокомментировал твой вызов «%s»", commenter.Username, dare.Title),
		fmt.Sprintf("/dare/%d", dare.ID),
	)
}

// triggerPushOnDareAccepted — кто-то принял твой вызов
func triggerPushOnDareAccepted(dare *Dare, taker *User) {
	if dare.AuthorID == taker.ID {
		return
	}
	go sendPushToUser(
		dare.AuthorID,
		"🔥 Твой вызов приняли!",
		fmt.Sprintf("@%s принял вызов «%s»", taker.Username, dare.Title),
		fmt.Sprintf("/dare/%d", dare.ID),
	)
}

// ═══════════════════════════════════════════════════════
//
//	STREAK REMINDER WORKER
//
// ═══════════════════════════════════════════════════════

// streakReminderWorker каждый день в 19:00 по МСК напоминает пользователям
// у которых стрик > 0 но сегодня ещё не было выполненных вызовов
func streakReminderWorker() {
	for {
		now := time.Now().In(time.FixedZone("MSK", 3*60*60))
		// Следующий запуск в 19:00 МСК
		next := time.Date(now.Year(), now.Month(), now.Day(), 19, 0, 0, 0, now.Location())
		if now.After(next) {
			next = next.Add(24 * time.Hour)
		}
		time.Sleep(time.Until(next))

		log.Println("⏰ Running streak reminder push...")
		today := time.Now().UTC().Truncate(24 * time.Hour)

		// Найти пользователей со стриком > 0 и без выполненного вызова сегодня
		var users []User
		db.Where("streak > 0 AND (last_done_at IS NULL OR last_done_at < ?)", today).Find(&users)

		for _, u := range users {
			sendPushToUser(
				u.ID,
				fmt.Sprintf("🔥 Не сломай стрик! (%d дней)", u.Streak),
				"Прими вызов сегодня, чтобы сохранить цепочку",
				"/",
			)
		}
		log.Printf("✅ Streak reminders sent to %d users", len(users))
	}
}
