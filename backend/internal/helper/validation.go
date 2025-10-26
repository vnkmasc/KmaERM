package helper

import "github.com/go-playground/validator/v10"

func FormatValidationMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "Trường này là bắt buộc"
	case "min":
		return "Phải có ít nhất " + fe.Param() + " ký tự"
	case "max":
		return "Không được vượt quá " + fe.Param() + " ký tự"
	case "email":
		return "Email không đúng định dạng"
	case "url":
		return "URL không đúng định dạng"
	}
	return fe.Error()
}
