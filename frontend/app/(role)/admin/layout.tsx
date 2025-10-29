import Footer from '@/components/common/footer'
import Header from '@/components/common/header'

interface Props {
  children: React.ReactNode
}

const AdminLayout: React.FC<Props> = ({ children }) => {
  return (
    <main className='flex h-screen flex-col'>
      <Header role='admin' />
      <div className='container mt-16 flex-1 py-6'>{children}</div>
      <Footer />
    </main>
  )
}

export default AdminLayout
