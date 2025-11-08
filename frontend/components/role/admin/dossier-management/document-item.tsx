import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemSeparator, ItemTitle } from '@/components/ui/item'
import { cn, showNotification } from '@/lib/utils/common'
import DossierService from '@/services/go/dossier.service'
import { DownloadIcon, EyeIcon, EyeOffIcon, FileIcon, TrashIcon, UploadIcon } from 'lucide-react'
import useSWRMutation from 'swr/mutation'
import UploadButton from '../common/upload-button'
import { IDossierDocument } from '@/types/dossier'
import { useState } from 'react'
import DeleteAlertDialog from '../common/delete-alert-dialog'
import DossierDocumentPdf from './dossier-document-pdf'

interface Props {
  refetch: () => void
  dossierDocument: IDossierDocument
  isOnDetailPage?: boolean
}

const DocumentItem: React.FC<Props> = (props) => {
  const hasFiles = (props.dossierDocument.files?.length || 0) > 0
  const [isOpenFiles, setIsOpenFiles] = useState(false)

  const mutateUploadDossierDocument = useSWRMutation(
    'dossier-upload-document',
    (_, { arg }: { arg: FormData }) => DossierService.uploadDossierDocument(props.dossierDocument.id, arg),
    {
      onSuccess: () => {
        showNotification('success', 'Tải tài liệu vào hồ sơ thành công')
        props.refetch()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Tải tài liệu vào hồ sơ thất bại')
      }
    }
  )

  const mutateViewDossierDocument = useSWRMutation(
    'dossier-view-document',
    async (
      _,
      {
        arg
      }: {
        arg: {
          id: string
          mode: 'download' | 'new-tab' | 'view'
          fileName?: string
        }
      }
    ) => {
      const res = await DossierService.viewDossierDocument(arg.id)

      const iframUrl = URL.createObjectURL(res)

      setTimeout(() => {
        URL.revokeObjectURL(iframUrl)
      }, 5000)

      switch (arg.mode) {
        case 'download':
          const link = document.createElement('a')
          link.href = iframUrl
          link.download = arg.fileName || 'document.pdf'
          link.click()
          break
        case 'new-tab':
          window.open(iframUrl, '_blank')
          break
        case 'view':
          return iframUrl
        default:
          return iframUrl
      }
    }
  )

  const mutateDeleteDossierDocument = useSWRMutation(
    'dossier-delete-document',
    (_, { arg }: { arg: string }) => DossierService.deleteDossierDocument(arg),
    {
      onSuccess: () => {
        showNotification('success', 'Xóa tài liệu hồ sơ thành công')
        props.refetch()
      },
      onError: (error) => {
        showNotification('error', error.message || 'Xóa tài liệu hồ sơ thất bại')
      }
    }
  )

  return (
    <Item
      variant={'outline'}
      className={!hasFiles ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500 dark:border-yellow-500' : ''}
    >
      <ItemContent>
        <ItemTitle>{props.dossierDocument.type.name}</ItemTitle>
        <ItemDescription>{props.dossierDocument.type.description}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <ButtonGroup>
          <Button
            variant={'outline'}
            size={props.isOnDetailPage ? 'default' : 'icon'}
            onClick={() => {
              if (hasFiles) {
                setIsOpenFiles(!isOpenFiles)
              } else {
                showNotification('warning', 'Hồ sơ tài liệu không có tài liệu, hãy tải tài liệu lên hồ sơ')
              }
            }}
            title='Xem/ẩn danh sách hồ sơ tài liệu'
          >
            {isOpenFiles ? (
              <EyeOffIcon className='text-accent-foreground' />
            ) : (
              <EyeIcon className='text-accent-foreground' />
            )}
            {props.isOnDetailPage && (
              <span className='text-accent-foreground hidden md:block'>
                {isOpenFiles ? 'Ẩn danh sách' : 'Xem danh sách'}
              </span>
            )}
          </Button>
          <UploadButton onUpload={(file: FormData) => mutateUploadDossierDocument.trigger(file)} accept='.pdf' multiple>
            <Button
              size={props.isOnDetailPage ? 'default' : 'icon'}
              isLoading={mutateUploadDossierDocument.isMutating}
              className='rounded-l-none'
              title='Tải tài liệu lên hồ sơ, hỗ trợ nhiều tài liệu'
            >
              <UploadIcon />
              {props.isOnDetailPage && <span className='hidden md:block'>Tải tài liệu</span>}
            </Button>
          </UploadButton>
        </ButtonGroup>
      </ItemActions>

      <ItemSeparator className={cn(!isOpenFiles && 'hidden')} />
      {isOpenFiles &&
        props.dossierDocument.files?.map((file) => (
          <Item key={file.id} variant={'outline'} size={'sm'} className='w-full'>
            <ItemContent>
              <ItemTitle>{file.title}</ItemTitle>
            </ItemContent>
            <ItemActions>
              <ButtonGroup>
                <Button
                  size={props.isOnDetailPage ? 'default' : 'icon'}
                  onClick={() => mutateViewDossierDocument.trigger({ id: file.id, mode: 'new-tab' })}
                >
                  <FileIcon />
                  {props.isOnDetailPage && <span className='hidden md:block'>Xem tài liệu</span>}
                </Button>
                <Button
                  size={props.isOnDetailPage ? 'default' : 'icon'}
                  variant={'outline'}
                  onClick={() =>
                    mutateViewDossierDocument.trigger({ id: file.id, mode: 'download', fileName: file.title })
                  }
                >
                  <DownloadIcon />
                  {props.isOnDetailPage && <span className='hidden md:block'>Tải xuống</span>}
                </Button>
                <DeleteAlertDialog
                  title='Xóa tài liệu hồ sơ'
                  description={
                    <span>
                      Tài liệu <b>{file.title}</b> sẽ bị xóa khỏi hồ sơ, thao tác này không thể hoàn tác.
                    </span>
                  }
                  onDelete={() => mutateDeleteDossierDocument.trigger(file.id)}
                >
                  <Button size={props.isOnDetailPage ? 'default' : 'icon'} variant={'destructive'}>
                    <TrashIcon />
                    {props.isOnDetailPage && <span className='hidden md:block'>Xóa tài liệu</span>}
                  </Button>
                </DeleteAlertDialog>
              </ButtonGroup>
            </ItemActions>
            {props.isOnDetailPage && <DossierDocumentPdf documentId={file.id} />}
          </Item>
        ))}
    </Item>
  )
}

export default DocumentItem
