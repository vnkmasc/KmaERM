import goService from '.'

export default class AuthService {
  static async signIn(email: string, password: string) {
    const res = await goService('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    return res
  }
}
