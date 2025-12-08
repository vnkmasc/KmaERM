package dto

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	AccessToken string      `json:"access_token"`
	User        UserSummary `json:"user"`
}

type UserSummary struct {
	ID            string  `json:"id"`
	Email         string  `json:"email"`
	FullName      string  `json:"full_name"`
	RoleID        string  `json:"role_id"`
	RoleName      string  `json:"role_name"`
	DoanhNghiepID *string `json:"doanh_nghiep_id"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}
