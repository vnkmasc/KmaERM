import { IDossierDialogData } from '@/types/dossier'
import { compareDateIsBefore, showNotification } from '@/lib/utils/common'
import useSWRMutation from 'swr/mutation'
import DossierService from '@/services/go/dossier.service'
import BusinessService from '@/services/go/business.service'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2Icon } from 'lucide-react'
import useSWR from 'swr'
import z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import CustomField from '@/components/common/custom-field'
import { DOSSIER_STATUS_OPTIONS, DOSSIER_TYPE_OPTIONS } from '@/constants/dossier'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { useEffect } from 'react'
import { Label } from '@/components/ui/label'

interface Props {
  idDetail: string | null | undefined
  onClose: () => void
  refetch?: () => void
  data: IDossierDialogData | undefined
  businessId: string
}

export const formSchema = z
  .object({
    dossierType: z.string().trim().min(1, { message: 'Vui lòng chọn loại hồ sơ' }),
    issuedDate: z.string(),
    receivedDate: z.string(),
    expectedReturnDate: z.string(),
    dossierStatus: z.string().trim().min(1, { message: 'Vui lòng chọn trạng thái hồ sơ' })
  })
  // Kiểm tra ngày đăng ký < ngày tiếp nhận
  .refine(
    (data) => {
      if (!data.issuedDate || !data.receivedDate) return true
      return compareDateIsBefore(data.issuedDate, data.receivedDate)
    },
    {
      message: 'Ngày đăng ký phải trước ngày tiếp nhận',
      path: ['issuedDate']
    }
  )

  // Kiểm tra ngày tiếp nhận < ngày hẹn trả
  .refine(
    (data) => {
      if (!data.receivedDate || !data.expectedReturnDate) return true
      return compareDateIsBefore(data.receivedDate, data.expectedReturnDate)
    },
    {
      message: 'Ngày tiếp nhận phải trước ngày hẹn trả',
      path: ['receivedDate']
    }
  )

const InfoDossierDialog: React.FC<Props> = (props) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dossierType: props.data?.dossierType || '',
      issuedDate: props.data?.issuedDate || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      receivedDate: props.data?.receivedDate || '',
      expectedReturnDate: props.data?.expectedReturnDate || '',
      dossierStatus: props.data?.dossierStatus || 'MoiTao'
    }
  })

  const queryBusinessDetail = useSWR(`business-detail-${props.businessId}`, () =>
    BusinessService.getBusinessById(props.businessId)
  )
  const mutateCreateDossier = useSWRMutation(
    'dossier-create',
    (_, { arg }: { arg: IDossierDialogData }) => DossierService.createDossier(arg, props.businessId),
    {
      onSuccess: () => {
        showNotification('success', 'Tạo hồ sơ thành công')
        props.refetch?.()
        props.onClose()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Tạo hồ sơ thất bại')
      }
    }
  )

  const mutateUpdateDossier = useSWRMutation(
    'dossier-update',
    (_, { arg }: { arg: IDossierDialogData }) => DossierService.updateDossier(props.idDetail!, arg),
    {
      onSuccess: () => {
        showNotification('success', 'Cập nhật hồ sơ thành công')
        props.refetch?.()
        props.onClose()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Cập nhật hồ sơ thất bại')
      }
    }
  )

  const handleSubmitDialog = (data: IDossierDialogData) => {
    if (props.idDetail) {
      mutateUpdateDossier.trigger(data)
    } else {
      mutateCreateDossier.trigger(data)
    }
  }

  // Reset form khi defaultValues thay đổi
  useEffect(() => {
    if (props.idDetail && props.data && Object.keys(props.data).length > 0) {
      for (const key of Object.keys(props.data)) {
        if (key === 'dossierCode') continue
        const typedKey = key as Exclude<keyof IDossierDialogData, 'dossierCode'>
        form.setValue(typedKey, props.data[typedKey] ?? '')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.idDetail, props.data])

  useEffect(() => {
    if (props.idDetail === undefined) {
      const timeoutId = setTimeout(() => {
        form.reset()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [props.idDetail, form])

  return (
    <Dialog open={props.idDetail !== undefined} onOpenChange={props.onClose}>
      <DialogContent className='max-h-[60vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{props.idDetail ? 'Chi tiết hồ sơ' : 'Tạo hồ sơ'}</DialogTitle>
        </DialogHeader>
        <Alert variant={'success'}>
          <CheckCircle2Icon />
          <AlertTitle>Sẵn sàng {props.idDetail ? 'chỉnh sửa' : 'tạo'} hồ sơ cho doanh nghiệp</AlertTitle>
          <AlertDescription className='font-semibold'>{queryBusinessDetail.data?.viName}</AlertDescription>
        </Alert>
        {props.idDetail && (
          <div className='flex gap-2'>
            <Label>Mã hồ sơ:</Label>
            <span className='text-muted-foreground'>{props.data?.dossierCode}</span>
          </div>
        )}
        <form onSubmit={form.handleSubmit(handleSubmitDialog)} className='space-y-4'>
          <CustomField
            name='dossierType'
            label='Loại hồ sơ'
            type='select'
            placeholder='Chọn loại hồ sơ'
            control={form.control}
            required
            setting={{
              select: {
                groups: [
                  {
                    label: 'Loại hồ sơ',
                    options: DOSSIER_TYPE_OPTIONS
                  }
                ]
              }
            }}
            description={props.idDetail ? 'Không thể thay đổi sau khi tạo hồ sơ' : undefined}
            disabled={props.idDetail ? true : false}
          />

          <CustomField
            name='dossierStatus'
            label='Trạng thái hồ sơ'
            type='select'
            placeholder='Chọn trạng thái hồ sơ'
            control={form.control}
            required
            setting={{
              select: {
                groups: [
                  {
                    label: 'Trạng thái hồ sơ',
                    options: DOSSIER_STATUS_OPTIONS
                  }
                ]
              }
            }}
            disabled={props.idDetail ? false : true}
            description={props.idDetail ? '' : 'Không thể chỉnh sửa khi tạo hồ sơ, mặc định là "Mới tạo"'}
          />
          <CustomField
            name='issuedDate'
            label='Ngày đăng ký'
            type='input'
            control={form.control}
            required
            setting={{
              input: { type: 'datetime-local' }
            }}
          />
          <CustomField
            name='receivedDate'
            label='Ngày tiếp nhận'
            type='input'
            control={form.control}
            required
            setting={{
              input: { type: 'datetime-local' }
            }}
          />
          <CustomField
            name='expectedReturnDate'
            label='Ngày hẹn trả'
            type='input'
            control={form.control}
            required
            setting={{
              input: { type: 'datetime-local' }
            }}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline' type='button'>
                Hủy bỏ
              </Button>
            </DialogClose>
            <Button type='submit' isLoading={form.formState.isSubmitting}>
              {props.idDetail ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default InfoDossierDialog
