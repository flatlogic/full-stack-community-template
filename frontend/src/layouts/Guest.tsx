import React, { ReactNode } from 'react'
import { useAppSelector } from '../stores/hooks'

type Props = {
  children: ReactNode
}

export default function LayoutGuest({ children }: Props) {
  const darkMode = useAppSelector((state) => state.style.darkMode)
  const bgColor = useAppSelector((state) => state.style.bgLayoutColor);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className={`${bgColor} dark:bg-slate-800 dark:text-slate-100`}>{children}</div>
    </div>
  )
}
