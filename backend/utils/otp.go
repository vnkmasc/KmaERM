package utils

import (
	"crypto/rand"
	"crypto/tls"
	"fmt"
	"math/big"
	"os"
	"strconv"

	"gopkg.in/gomail.v2"
)

func GenerateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func SendEmailOTP(toEmail, otpCode string) error {

	smtpHost := os.Getenv("SMTP_HOST")
	smtpPortStr := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")

	if smtpHost == "" || smtpUser == "" {
		return fmt.Errorf("chưa cấu hình SMTP trong file .env")
	}

	port, _ := strconv.Atoi(smtpPortStr)

	m := gomail.NewMessage()
	m.SetHeader("From", smtpUser)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Mã xác thực OTP - KmaERM")

	body := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
			<h2 style="color: #0056b3;">Xác thực tài khoản KmaERM</h2>
			<p>Xin chào,</p>
			<p>Bạn vừa yêu cầu mã xác thực OTP để đổi mật khẩu hoặc đăng nhập.</p>
			<p>Mã của bạn là: <strong style="font-size: 24px; color: #d9534f; letter-spacing: 5px;">%s</strong></p>
			<p>Mã này sẽ hết hạn trong vòng <strong>5 phút</strong>.</p>
			<hr>
			<p style="font-size: 12px; color: #888;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
		</div>
	`, otpCode)

	m.SetBody("text/html", body)

	d := gomail.NewDialer(smtpHost, port, smtpUser, smtpPass)

	d.TLSConfig = &tls.Config{InsecureSkipVerify: true}

	if err := d.DialAndSend(m); err != nil {
		return err
	}

	return nil
}
