import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/table'
import { PAGE_SIZE } from '@/constants/common'

interface Props {
  // eslint-disable-next-line no-unused-vars
  items: { className?: string; header: string; value: string; render?: (item?: any) => React.ReactNode }[]
  data: any[]
  page?: number
  pageSize?: number
}

const TableList: React.FC<Props> = (props) => {
  return (
    <Table className='mt-4'>
      <TableHeader>
        <TableRow>
          <TableHead>STT</TableHead>
          {props.items.map((header, index) => (
            <TableHead key={index}>{header.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody className='overflow-y-auto'>
        {props.data.length === 0 ? (
          <TableEmpty colSpan={props.items.length + 1} />
        ) : (
          props.data.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1 + ((props.page ?? 1) - 1) * (props.pageSize ?? PAGE_SIZE)}</TableCell>
              {props.items.map((child, index) => (
                <TableCell key={index}>
                  <div
                    className={`${child.className} truncate`}
                    title={typeof item[child.value] === 'string' ? item[child.value] : ''}
                  >
                    {child.render ? child.render(item) : item[child.value]}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export default TableList
