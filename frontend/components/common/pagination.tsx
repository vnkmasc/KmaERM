import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

interface Props {
  page: number
  totalPage: number
  // eslint-disable-next-line no-unused-vars
  handleChangePage: (page: number) => void
}

const CommonPagination = ({ page, totalPage, handleChangePage }: Props) => {
  // Helper function to generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []

    if (totalPage <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPage; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (page <= 4) {
        // Show pages 2, 3, 4, 5 and ellipsis
        for (let i = 2; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPage)
      } else if (page >= totalPage - 3) {
        // Show ellipsis and last 5 pages
        pages.push('ellipsis')
        for (let i = totalPage - 4; i <= totalPage; i++) {
          pages.push(i)
        }
      } else {
        // Show ellipsis, current page area, ellipsis
        pages.push('ellipsis')
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPage)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className='mt-4'>
      <Pagination className='md:justify-end'>
        <PaginationContent>
          <PaginationItem className='cursor-pointer'>
            <PaginationPrevious
              onClick={() => page > 1 && handleChangePage(page - 1)}
              className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>

          {pageNumbers.map((pageNum, index) => (
            <PaginationItem key={index} className='cursor-pointer'>
              {pageNum === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink onClick={() => handleChangePage(pageNum)} isActive={pageNum === page}>
                  {pageNum}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem className='cursor-pointer'>
            <PaginationNext
              onClick={() => page < totalPage && handleChangePage(page + 1)}
              className={page >= totalPage ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export default CommonPagination
