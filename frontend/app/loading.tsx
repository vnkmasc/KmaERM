import '@/public/assets/styles/suspend-page.css'

const SuspendPage: React.FC = () => {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm'>
      {/* <div className='flex flex-col items-center gap-3 p-4'>
        <Loader className='h-16 w-16 animate-spin' />
        <p className='text-sm font-medium'>Đang tải</p>
      </div> */}
      <div className='suspend-page'></div>
    </div>
  )
}

export default SuspendPage
