'use client'

import Image from 'next/image'
import background from '@/public/assets/images/background.jpg'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DialogDescription } from '@/components/ui/dialog'
import logo from '@/public/assets/images/logo.png'
import { useRouter } from 'next/navigation'
import z from 'zod'
import { validateEmail, validatePassword } from '@/lib/utils/validators'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showNotification } from '@/lib/utils/common'
import CustomField from '@/components/common/custom-field'
import { LogInIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AuthService from '@/services/go/auth.service'
import useSWRMutation from 'swr/mutation'
import { signIn } from '@/lib/auth/auth'

const formSchema = z.object({
  email: validateEmail,
  password: validatePassword
})

export default function SignUpPage() {
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const mutateSignUp = useSWRMutation(
    'sign-up',
    (_, { arg }: { arg: any }) => AuthService.signUp(arg.email, arg.password),
    {
      onSuccess: () => {
        signIn({ email: form.getValues('email'), password: form.getValues('password') })
        showNotification('success', 'Đăng ký tài khoản thành công, chào mừng bạn đến với ErmBCY')
        router.refresh()
      },
      onError: (error: any) => {
        showNotification('error', error.message || 'Đăng ký tài khoản thất bại')
      }
    }
  )

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    return await mutateSignUp.trigger({ email: data.email, password: data.password })
  }

  return (
    <div className='relative top-0 right-0 bottom-0 left-0 h-screen'>
      <Image src={background} width={1500} height={1500} className='h-full w-full object-cover' alt='no-image' />
      <Dialog open>
        <DialogContent className='rounded-lg sm:max-w-[450px] [&>button]:hidden'>
          <DialogHeader>
            <DialogTitle>
              <span
                className='flex cursor-pointer items-center justify-center gap-2'
                onClick={() => {
                  router.push('/')
                }}
              >
                <Image src={logo} alt='ErmBCY' width={50} height={50} />
                <span className='text-main text-xl font-semibold md:text-2xl'>ErmBCY</span>
              </span>
            </DialogTitle>
            <span className='text-xl font-semibold md:text-2xl'>Đăng ký</span>
            <DialogDescription>Chào mừng bạn đến với hệ thống quản lý doanh nghiệp</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <CustomField
              type='input'
              control={form.control}
              name='email'
              label='Email'
              placeholder='Nhập email'
              setting={{ input: { type: 'email' } }}
              required
            />
            <CustomField
              type='password'
              control={form.control}
              name='password'
              label='Mật khẩu'
              placeholder='Nhập mật khẩu'
              required
            />
            <Button type='submit' className='w-full' isLoading={form.formState.isSubmitting}>
              <LogInIcon /> Đăng ký
            </Button>
          </form>
          <div className='relative'>
            <hr className='my-4' />
            <span className='absolute top-1 left-1/2 -translate-x-1/2 text-sm text-gray-500'>
              <div className='dark:bg-background bg-white px-2 text-sm'>hoặc</div>
            </span>
          </div>
          <p className='text-center text-sm'>
            Bạn đã có tài khoản?{' '}
            <span className='cursor-pointer underline' onClick={() => router.push('/auth/sign-in')}>
              Đăng nhập
            </span>
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
