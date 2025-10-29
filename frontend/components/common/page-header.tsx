interface Props {
  title: string
  actions?: React.ReactNode[]
}

const PageHeader: React.FC<Props> = (props) => {
  return (
    <div className='mb-3 flex items-center justify-between'>
      <h2>{props.title}</h2>
      <div className='flex items-center gap-2'>{props.actions?.map((item) => item)}</div>
    </div>
  )
}

export default PageHeader
