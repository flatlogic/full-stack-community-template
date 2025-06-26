import React, { ReactNode } from 'react'

type Props = {
  noPadding?: boolean
  className?: string
  children?: ReactNode
  id?: string
}

export default function CardBoxComponentBody({ noPadding = false, className, children, id }: Props) {
  return <div id={id} className={`flex-1 ${noPadding ? '' : 'p-6'} ${className}`}>{children}</div>
}
