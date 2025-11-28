import Image from 'next/image'
import logo from '@/public/assets/images/logo.png'
import { Facebook, Github, GraduationCap, MapPinned } from 'lucide-react'
import Link from 'next/link'

const defaultSocialLinks = [
  { icon: <GraduationCap className='size-5' />, href: 'https://actvn.edu.vn', label: 'Trang chủ học viện' },
  { icon: <Facebook className='size-5' />, href: 'https://www.facebook.com/hocvienkythuatmatma', label: 'Facebook' },
  { icon: <MapPinned className='size-5' />, href: 'https://maps.app.goo.gl/nH4ungjtTKWfox2c8', label: 'Địa chỉ' },
  { icon: <Github className='size-5' />, href: 'https://github.com/vnkmasc/KmaERM', label: 'Github' }
]

const Footer: React.FC = () => {
  return (
    <footer className='dark:bg-background w-full border-gray-500 bg-gray-100 py-8 pt-8 dark:border-t'>
      <div className='container space-y-4'>
        <div className='flex items-center gap-2 lg:justify-start'>
          <Link href='/'>
            <Image src={logo} alt='logo' title='ErmBCY' width={32} height={32} className='h-8' />
          </Link>
          <h2 className='text-main font-semibold'>ErmBCY</h2>
        </div>
        <p className='text-muted-foreground text-sm'>Giải pháp quản lý doanh nghiệp ứng dụng Blockchain.</p>
        <div className='flex flex-col justify-between gap-4 md:flex-row'>
          <p className='text-muted-foreground text-sm'>© 2025 ErmBCY. Bản quyền thuộc về Học viện Kỹ thuật mật mã.</p>
          <ul className='text-muted-foreground flex items-center space-x-6'>
            {defaultSocialLinks.map((social, idx) => (
              <li key={idx} className='hover:text-primary font-medium'>
                <a href={social.href} aria-label={social.label} target='_blank'>
                  {social.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

export default Footer
