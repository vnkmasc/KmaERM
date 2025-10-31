'use client'

import { Button } from '../ui/button'
import Image from 'next/image'
import { ChevronsUpDown, LogInIcon, MenuIcon, Settings } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '../ui/navigation-menu'
import Link from 'next/link'
import logo from '@/public/assets/images/logo.png'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import ThemeSwitch from './theme-switch'
import UseBreakpoint from '@/hooks/use-breakpoint'
import { useState } from 'react'
import SignoutDialog from './signout-dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'

interface Props {
  role: 'admin' | null
}

interface IHeaderMenuItem {
  title: string
  href?: string
  groups?: {
    title: string
    href: string
  }[]
}

const Header: React.FC<Props> = (props) => {
  const { md, lg } = UseBreakpoint()
  const [openSignoutDialog, setOpenSignoutDialog] = useState(false)

  const adminPages: IHeaderMenuItem[] = [
    {
      title: md && !lg ? 'QLDN' : 'Quản lý doanh nghiệp',
      href: '/admin/business-management'
    },
    {
      title: md && !lg ? 'QLHS' : 'Quản lý hồ sơ',
      href: '/admin/profile-management'
    },
    {
      title: md && !lg ? 'QLGP' : 'Quản lý giấy phép',
      groups: [
        { title: 'Giấy phép kinh doanh', href: '/admin/license-management/business' },
        { title: 'Giấy phép xuất/nhập khẩu', href: '/admin/license-management/import-export' }
      ]
    }
  ]

  return (
    <div className='fixed top-0 z-10 h-16 w-full shadow-lg'>
      <header className='container flex h-full items-center justify-between bg-white dark:bg-black'>
        {props.role !== null ? (
          <div className='flex gap-2 md:hidden'>
            <Sheet>
              <SheetTrigger asChild>
                <Button size={'icon'} variant={'ghost'}>
                  <MenuIcon />
                </Button>
              </SheetTrigger>

              <SheetContent side={'left'}>
                <SheetHeader>
                  <SheetTitle className='text-start'>Chức năng</SheetTitle>
                </SheetHeader>
                {adminPages.map((item) =>
                  item.href ? (
                    <Link href={item.href} key={item.href}>
                      <Button variant={'link'}>{item.title}</Button>
                    </Link>
                  ) : (
                    <Collapsible key={item.title}>
                      <CollapsibleTrigger asChild>
                        <Button variant={'link'} className='gap-4'>
                          {item.title}
                          <ChevronsUpDown />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className='pl-4'>
                          {item.groups?.map((group) => (
                            <li key={group.href}>
                              <Link href={group.href}>
                                <Button variant={'link'}>{group.title}</Button>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                )}
              </SheetContent>
            </Sheet>
          </div>
        ) : null}

        <Link href='/'>
          <div className='flex items-center gap-1'>
            <Image src={logo} alt='logoKmaERM' width={30} height={30} />
            <h1 className='text-main text-lg font-semibold sm:text-xl'>KmaERM</h1>
          </div>
        </Link>

        {props.role !== null ? (
          <NavigationMenu viewport={false} className='hidden md:flex md:gap-2'>
            <NavigationMenuList>
              {adminPages.map((item, idx) =>
                item.href ? (
                  <NavigationMenuItem key={idx}>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                      <Link href={item.href}>{item.title}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ) : (
                  <NavigationMenuItem key={idx}>
                    <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className='grid w-[200px] gap-4'>
                        {item.groups?.map((group, idx) => (
                          <li key={idx}>
                            <NavigationMenuLink asChild>
                              <Link href={group.href}>{group.title}</Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )
              )}
            </NavigationMenuList>
          </NavigationMenu>
        ) : null}

        {props.role !== null ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size={'icon'}>
                <Settings />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-40'>
              <DropdownMenuLabel>Cấu hình</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <ThemeSwitch />
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem>Đổi mật khẩu</DropdownMenuItem>
                <DropdownMenuItem
                  className='text-destructive hover:text-destructive!'
                  onClick={() => setOpenSignoutDialog(true)}
                >
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href='/auth/sign-in'>
            <Button>
              <LogInIcon /> <span className='hidden md:block'>Đăng nhập</span>
            </Button>
          </Link>
        )}
      </header>
      <SignoutDialog open={openSignoutDialog} onOpenChange={setOpenSignoutDialog} />
    </div>
  )
}

export default Header
