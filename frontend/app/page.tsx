import Header from '@/components/common/header'
import { getSession } from '@/lib/auth/session'
import Image from 'next/image'
import logo from '@/public/assets/images/logo.png'
import Footer from '@/components/common/footer'

const HomePage = async () => {
  const session = await getSession()

  return (
    <main className='flex h-screen flex-col'>
      <Header role={(session?.role as 'admin') ?? null} />
      <section className='container mt-16 flex flex-1 flex-col items-center py-8'>
        <div className='flex items-center gap-2'>
          <Image src={logo} alt='logo' width={50} height={50} />
          <h1 className='text-main text-2xl font-semibold sm:text-4xl'>ErmBCY</h1>
        </div>
        <h1 className='mt-3 text-center text-xl font-semibold sm:text-3xl md:mt-6'>
          Giải pháp <span className='text-main'>quản lý doanh nghiệp </span> ứng dụng{' '}
          <span className='text-main'>Blockchain</span>
        </h1>
      </section>
      <Footer />
    </main>
  )
}

export default HomePage
