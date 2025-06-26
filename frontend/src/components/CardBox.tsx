import React, { ReactNode } from 'react'
import CardBoxComponentBody from './CardBoxComponentBody'
import CardBoxComponentFooter from './CardBoxComponentFooter'
import { useAppSelector } from '../stores/hooks';

type Props = {
  rounded?: string
  flex?: string
  className?: string
  hasComponentLayout?: boolean
  cardBoxClassName?: string
  hasTable?: boolean
  isHoverable?: boolean
  isModal?: boolean
  children?: ReactNode
  footer?: ReactNode
  isList?:boolean 
  id?: string;
  onClick?: (e: React.MouseEvent) => void
}

export default function CardBox({
  rounded = 'rounded',
  flex = 'flex-col',
  className = '',
  hasComponentLayout = false,
  cardBoxClassName = '',
  hasTable = false,
  isHoverable = false,
  isList = false,
  isModal = false,
  children,
  footer,
  id ='',
  onClick,
}: Props) {
  const corners = useAppSelector((state) => state.style.corners);
  const cardsStyle = useAppSelector((state) => state.style.cardsStyle);
  const componentClass = [
    `flex  dark:border-dark-700 dark:bg-dark-900`,
    className,
    corners !== 'rounded-full'? corners : 'rounded-3xl',
    flex,
    isList ? '' : `${cardsStyle}`,
    hasTable ? '' : `border border-brand-400 dark:border-dark-700`
  ]

  if (isHoverable) {
    componentClass.push('hover:shadow-lg transition-shadow duration-500')
  }

  return React.createElement(
    'div',
    { className: componentClass.join(' '), onClick },
    hasComponentLayout ? (
      children
    ) : (
      <>
        <CardBoxComponentBody id={id} noPadding={hasTable} className={cardBoxClassName}>{children}</CardBoxComponentBody>
        {footer && <CardBoxComponentFooter>{footer}</CardBoxComponentFooter>}
      </>
    )
  )
}
