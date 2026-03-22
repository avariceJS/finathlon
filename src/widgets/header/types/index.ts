import type { ReactNode } from 'react'

import type { NavItem } from '@/pages/home/model/types'

export type HeaderProps = {
  navigation: NavItem[]
  hideAuthButton?: boolean
  rightSlot?: ReactNode
}
