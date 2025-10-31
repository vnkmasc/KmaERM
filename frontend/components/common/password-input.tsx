import { useState } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Eye, EyeOff } from 'lucide-react'
import { ControllerRenderProps } from 'react-hook-form'

interface Props {
  field: ControllerRenderProps<any, string>
}

const PasswordInput: React.FC<Props> = (props) => {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <InputGroup>
      <InputGroupInput
        id={'password'}
        placeholder='Nhập mật khẩu'
        required
        type={showPassword ? 'text' : 'password'}
        {...props.field}
      />
      <InputGroupAddon className='cursor-pointer' align='inline-end' onClick={() => setShowPassword(!showPassword)}>
        {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
      </InputGroupAddon>
    </InputGroup>
  )
}
export default PasswordInput
