export type UserPayloadObject = {
  name: string
  email: string
  avatar: string
}

export type MenuAsideItem = {
  label: string
  icon?: string
  href?: string
  target?: string
  color?: ColorButtonKey
  isLogout?: boolean
  withDevider?: boolean;
  menu?: MenuAsideItem[]
  permissions?: string | string[]
}

export type MenuNavBarItem = {
  label?: string
  icon?: string
  href?: string
  target?: string
  isDivider?: boolean
  isLogout?: boolean
  isDesktopNoLabel?: boolean
  isToggleLightDark?: boolean
  isCurrentUser?: boolean
  menu?: MenuNavBarItem[]
}

export type ColorKey = 'white' | 'light' | 'contrast' | 'success' | 'danger' | 'warning' | 'info'

export type ColorButtonKey =
  | 'white'
  | 'whiteDark'
  | 'lightDark'
  | 'contrast'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'void'

export type BgKey = 'purplePink' | 'pinkRed' | 'violet'

export type TrendType = 'up' | 'down' | 'success' | 'danger' | 'warning' | 'info'

export type TransactionType = 'withdraw' | 'deposit' | 'invoice' | 'payment'

export type Transaction = {
  id: number
  amount: number
  account: string
  name: string
  date: string
  type: TransactionType
  business: string
}

export type Client = {
  id: number
  avatar: string
  login: string
  name: string
  city: string,
  company: string
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  progress: number,
  role: string
  disabled: boolean
  created: string
  created_mm_dd_yyyy: string
}

export interface User {
  id: string;
  firstName: string;
  lastName?: any;
  phoneNumber?: any;
  email: string;
  role: string;
  disabled: boolean;
  password: string;
  emailVerified: boolean;
  emailVerificationToken?: any;
  emailVerificationTokenExpiresAt?: any;
  passwordResetToken?: any;
  passwordResetTokenExpiresAt?: any;
  provider: string;
  importHash?: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: any;
  createdById?: any;
  updatedById?: any;
  avatar: any[];
  notes: any[];
}

export type StyleKey = 'white' | 'basic'

export type UserForm = {
  name: string
  email: string
}
