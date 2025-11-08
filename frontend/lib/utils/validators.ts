import z from 'zod'

export const validateEmail = z.email({ message: 'Email không hợp lệ (VD: example@gmail.com)' })

export const validatePassword = z.string().trim().min(8, {
  message: 'Mật khẩu phải có ít nhất 8 ký tự'
})

export const validateVNIPhoneNumber = z
  .string()
  .trim()
  .regex(/^(((\+84)|0)(3|5|7|8|9)[0-9]{8})$/, {
    message: 'Số điện thoại không hợp lệ'
  })
  .or(z.literal(''))

export const validateWebsite = z
  .url({
    message: 'URL không hợp lệ'
  })
  .refine((val) => /^https?:\/\//.test(val), {
    message: 'URL phải bắt đầu bằng http:// hoặc https://'
  })
  .or(z.literal(''))

export const validateBusinessCode = z
  .string()
  .trim()
  .min(10, {
    message: 'Mã số doanh nghiệp phải có ít nhất 10 ký tự'
  })
  .max(14, {
    message: 'Mã số doanh nghiệp không được vượt quá 14 ký tự'
  })
  .refine((val) => !isNaN(Number(val)), {
    message: 'Mã số doanh nghiệp chỉ được chứa các ký tự số'
  })

export const validatePersonalName = z
  .string()
  .refine((val) => val === '' || val.length >= 2, {
    message: 'Tên phải có ít nhất 2 ký tự'
  })
  .max(100, { message: 'Tên không được vượt quá 100 ký tự' })
  .refine((val) => !/\s{2,}/.test(val), {
    message: 'Tên không được chứa 2 khoảng trắng liên tiếp'
  })
  .refine((val) => val === val.trim(), {
    message: 'Tên không được bắt đầu/kết thúc bằng khoảng trắng'
  })
  .refine((val) => val === '' || /^[A-Za-zÀ-ỹà-ỹ\s]+$/.test(val), {
    message: 'Tên không đước chứa số hoặc ký tự đặc biệt'
  })
  .or(z.literal(''))

export const validateCommonName = z
  .string()
  .refine((val) => val === '' || val.length >= 2, {
    message: 'Tên phải có ít nhất 2 ký tự'
  })
  .max(100, { message: 'Tên không được vượt quá 100 ký tự' })
  .refine((val) => !/\s{2,}/.test(val), {
    message: 'Tên không được chứa 2 khoảng trắng liên tiếp'
  })
  .refine((val) => val === val.trim(), {
    message: 'Tên không được bắt đầu/kết thúc bằng khoảng trắng'
  })
  .or(z.literal(''))

export const validateNoEmpty = z.string().trim().nonempty({ message: 'Trường này không được để trống' })
