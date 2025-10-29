import z from 'zod'

export const validateEmail = z.email({ message: 'Email không hợp lệ (VD: example@gmail.com)' })

export const validatePassword = z.string().trim().min(8, {
  message: 'Mật khẩu phải có ít nhất 8 ký tự'
})
