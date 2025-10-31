'use client'

import { useRef, forwardRef, useImperativeHandle } from 'react'

interface Props {
  // eslint-disable-next-line no-unused-vars
  onUpload: (file: FormData) => void
  multiple?: boolean
  children: React.ReactNode
  accept?: string
}

export interface UploadButtonRef {
  triggerUpload: () => void
}

const UploadButton = forwardRef<UploadButtonRef, Props>((props, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  useImperativeHandle(ref, () => ({
    triggerUpload: handleButtonClick
  }))

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        props.onUpload(formData)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type='file'
        accept={props.accept || '.xlsx, .xls, .csv, .pdf'}
        onChange={handleFileChange}
        className='hidden'
        multiple={props.multiple}
      />
      <span onClick={handleButtonClick}>{props.children}</span>
    </>
  )
})

UploadButton.displayName = 'UploadButton'

export default UploadButton
