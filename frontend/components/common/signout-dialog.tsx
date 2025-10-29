import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '../ui/alert-dialog'

import { signOut } from '@/lib/auth/auth'
import React, { Dispatch } from 'react'

interface Props {
  open: boolean
  onOpenChange: Dispatch<React.SetStateAction<boolean>>
}

const SignoutDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='rounded-lg'>
        <AlertDialogTitle>Đăng xuất</AlertDialogTitle>
        <AlertDialogDescription>Bạn có chắc chắn muốn đăng xuất không?</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
          <AlertDialogAction onClick={signOut}>Đăng xuất</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default SignoutDialog
