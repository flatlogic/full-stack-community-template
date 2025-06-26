import React, { useEffect, useState } from 'react'
import { mdiMinus, mdiPlus } from '@mdi/js'
import BaseIcon from './BaseIcon'
import Link from 'next/link'
import { getButtonColor } from '../colors'
import AsideMenuList from './AsideMenuList'
import { MenuAsideItem } from '../interfaces'
import { useAppSelector } from '../stores/hooks'
import { useRouter } from 'next/router'

type Props = {
  item: MenuAsideItem
  isDropdownList?: boolean
}

const AsideMenuItem = ({ item, isDropdownList = false }: Props) => {
  const [isLinkActive, setIsLinkActive] = useState(false)
  const [isDropdownActive, setIsDropdownActive] = useState(false)

  const asideMenuItemStyle = useAppSelector((state) => state.style.asideMenuItemStyle)
  const asideMenuDropdownStyle = useAppSelector((state) => state.style.asideMenuDropdownStyle)
  const asideMenuItemActiveStyle = useAppSelector((state) => state.style.asideMenuItemActiveStyle)
  const borders = useAppSelector((state) => state.style.borders);
  const activeLinkColor = useAppSelector(
    (state) => state.style.activeLinkColor,
  );
  const activeClassAddon = !item.color && isLinkActive ? asideMenuItemActiveStyle : ''

  const { asPath, isReady } = useRouter()

  useEffect(() => {
    if (item.href && isReady) {
      const linkPathName = new URL(item.href, location.href).pathname + '/';
      const activePathname = new URL(asPath, location.href).pathname

      const activeView = activePathname.split('/')[1];
      const linkPathNameView = linkPathName.split('/')[1];

      setIsLinkActive(linkPathNameView === activeView);
    }
  }, [item.href, isReady, asPath])

  const asideMenuItemInnerContents = (
    <>
      {item.icon && (
        <BaseIcon path={item.icon} className={`flex-none mx-3 ${activeClassAddon}`} size="18" />
      )}
      <span
        className={`grow text-ellipsis line-clamp-1 ${
          item.menu ? '' : 'pr-12'
        } ${activeClassAddon}`}
      >
        {item.label}
      </span>
      {item.menu && (
        <BaseIcon
          path={isDropdownActive ? mdiMinus : mdiPlus}
          className={`flex-none ${activeClassAddon}`}
          w="w-12"
        />
      )}
    </>
  )

  const componentClass = [
    'flex cursor-pointer py-1.5 ',
    isDropdownList ? 'px-6 text-sm' : '',
    item.color
        ? getButtonColor(item.color, false, true)
        : `${asideMenuItemStyle}`,
    isLinkActive
        ? `text-black ${activeLinkColor} dark:text-white dark:bg-dark-800`
        : '',
  ].join(' ');

  return (
    <li className={'px-3 py-1.5'}>
      {item.withDevider && <hr className={`${borders} mb-3`} />}
      {item.href && (
        <Link href={item.href} target={item.target} className={componentClass}>
          {asideMenuItemInnerContents}
        </Link>
      )}
      {!item.href && (
        <div className={componentClass} onClick={() => setIsDropdownActive(!isDropdownActive)}>
          {asideMenuItemInnerContents}
        </div>
      )}
      {item.menu && (
        <AsideMenuList
          menu={item.menu}
          className={`${asideMenuDropdownStyle} ${
            isDropdownActive ? 'block dark:bg-slate-800/50' : 'hidden'
          }`}
          isDropdownList
        />
      )}
    </li>
  )
}

export default AsideMenuItem
