import CustomField from '@/components/common/custom-field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { IZodCustomField } from '@/types/form-field'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

interface Props {
  items: IZodCustomField[]
  mode: 'create' | 'update' | undefined
  title: string
  // eslint-disable-next-line no-unused-vars
  onSubmit: (data: any) => void
  onClose: () => void
  defaultValues?: any
}

const DetailDialog: React.FC<Props> = (props) => {
  const formSchema = z.object(
    props.items.reduce(
      (acc, obj) => {
        acc[obj.name] = obj.validator || z.any()
        return acc
      },
      {} as Record<string, z.ZodType>
    )
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: props.items.reduce(
      (acc, obj) => {
        acc[obj.name] = ''
        return acc
      },
      {} as Record<string, string>
    )
  })

  // Reset form khi defaultValues thay đổi
  useEffect(() => {
    if (props.mode === 'update' && props.defaultValues && Object.keys(props.defaultValues).length > 0) {
      for (const key in props.defaultValues) {
        form.setValue(key, props.defaultValues[key] ?? '')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode, props.defaultValues])

  useEffect(() => {
    if (props.mode === undefined) {
      const timeoutId = setTimeout(() => {
        form.reset()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [props.mode, form])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      props.onClose()
    }
  }

  return (
    <Dialog open={props.mode !== undefined} onOpenChange={handleOpenChange}>
      <DialogContent className='p-0 sm:max-w-[500px]'>
        <DialogHeader className='p-6 pb-0'>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(props.onSubmit)} className='flex flex-col'>
          <div className='max-h-[60vh] space-y-4 overflow-y-auto px-6 py-4'>
            {props.items.map((prop, index) => (
              <CustomField {...prop} control={form.control} key={index} />
            ))}
          </div>
          <DialogFooter className='px-6 pt-4 pb-6'>
            <DialogClose asChild>
              <Button variant='outline' type='button'>
                Hủy bỏ
              </Button>
            </DialogClose>
            <Button type='submit' isLoading={form.formState.isSubmitting}>
              {props.mode === 'create' ? 'Tạo mới' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default DetailDialog
