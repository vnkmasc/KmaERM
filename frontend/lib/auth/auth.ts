'use server'

import { redirect } from 'next/navigation'
import { createSession, deleteSession } from './session'
import AuthService from '@/services/go/auth.service'

export async function signOut() {
  await deleteSession()
  redirect('/')
}

export async function signIn(payload: { email: string; password: string }) {
  try {
    // const data = await AuthService.signIn(payload.email, payload.password)
    const data = {
      token: 'mocked-jwt-token',
      role: 'admin'
    }

    if (!data.token) {
      return false
    }

    await createSession({
      accessToken: data.token,
      role: data.role
    })

    return true
  } catch (error) {
    console.error('Error sign in', error)
    return false
  }
}
