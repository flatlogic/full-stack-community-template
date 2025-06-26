import { Children, cloneElement, ReactElement, ReactNode } from 'react'
import BaseIcon from './BaseIcon'
import { useAppSelector } from '../stores/hooks';

type Props = {
  label?: string
  labelFor?: string
  help?: string
  icons?: string[] | null[]
  isBorderless?: boolean
  isTransparent?: boolean
  hasTextareaHeight?: boolean
  children: ReactNode
  disabled?: boolean
  borderButtom?: boolean
  diversity?: boolean
  websiteBg?: boolean
}

const FormField = ({ icons = [], ...props }: Props) => {
  const childrenCount = Children.count(props.children)
  const bgColor = useAppSelector((state) => state.style.cardsColor);
  const focusRing = useAppSelector((state) => state.style.focusRingColor);
  const corners = useAppSelector((state) => state.style.corners);
  const bgWebsiteColor = useAppSelector((state) => state.style.bgLayoutColor);
  let elementWrapperClass = ''

  switch (childrenCount) {
    case 2:
      elementWrapperClass = 'grid grid-cols-1 gap-3 md:grid-cols-2'
      break
    case 3:
      elementWrapperClass = 'grid grid-cols-1 gap-3 md:grid-cols-3'
  }

  const controlClassName = [
    `px-3 py-2 max-w-full border-gray-300 dark:border-dark-700 ${corners} w-full dark:placeholder-gray-400`,
    `${focusRing}`,
    props.hasTextareaHeight ? 'h-24' : 'h-12',
    props.isBorderless ? 'border-0' : 'border',
    props.isTransparent ? 'bg-transparent' : `${bgColor} dark:bg-dark-800`,
    props.disabled ? 'bg-gray-200 text-gray-100 dark:bg-dark-900 disabled' : '',
    props.borderButtom ? `border-0 border-b ${props.diversity ? "border-gray-400" : "placeholder-white border-gray-300/10 border-white"} rounded-none focus:ring-0` : '',
  ].join(' ');

  return (
    <div className="mb-6 last:mb-0">
      {props.label && (
        <label
          htmlFor={props.labelFor}
          className={`block font-bold mb-2 ${props.labelFor ? 'cursor-pointer' : ''}`}
        >
          {props.label}
        </label>
      )}
      <div className={`${elementWrapperClass}`}>
        {Children.map(props.children, (child: ReactElement, index) => (
          <div className="relative">
            {cloneElement(child as ReactElement<{ className?: string }>, {
                className: `${controlClassName} ${icons[index] ? 'pl-10' : ''}`,
            })}
            {icons[index] && (
              <BaseIcon
                path={icons[index]}
                w="w-10"
                h={props.hasTextareaHeight ? 'h-full' : 'h-12'}
                className="absolute top-0 left-0 z-10 pointer-events-none text-gray-500 dark:text-slate-400"
              />
            )}
          </div>
        ))}
      </div>
      {props.help && (
          <div className='text-xs text-gray-500 dark:text-dark-600 mt-1'>{props.help}</div>
      )}
    </div>
  )
}

export default FormField
