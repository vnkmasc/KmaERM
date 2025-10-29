import CustomField from '@/components/common/custom-field'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { IZodCustomField } from '@/types/form-field'
import { zodResolver } from '@hookform/resolvers/zod'
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
        acc[obj.name] = props.defaultValues ? props.defaultValues[obj.name] : ''
        return acc
      },
      {} as Record<string, string>
    )
  })

  return (
    <Dialog open={props.mode !== undefined} onOpenChange={props.onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(props.onSubmit)} className='space-y-4'>
          {props.items.map((prop, index) => (
            <CustomField {...prop} control={form.control} key={index} />
          ))}
          <DialogFooter>
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
