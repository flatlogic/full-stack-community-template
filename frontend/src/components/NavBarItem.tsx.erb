import React, {useEffect, useRef} from 'react'
import Link from 'next/link'
import { useState } from 'react'
import { mdiChevronUp, mdiChevronDown } from '@mdi/js'
import BaseDivider from './BaseDivider'
import BaseIcon from './BaseIcon'
import UserAvatarCurrentUser from './UserAvatarCurrentUser'
import NavBarMenuList from './NavBarMenuList'
import { useAppDispatch, useAppSelector } from '../stores/hooks'
import { MenuNavBarItem } from '../interfaces'
import { setDarkMode } from '../stores/styleSlice'
import { logoutUser } from '../stores/authSlice'
import { useRouter } from 'next/router';
import ClickOutside from "./ClickOutside";

type Props = {
  item: MenuNavBarItem
}

export default function NavBarItem({ item }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const excludedRef = useRef(null);

  const navBarItemLabelActiveColorStyle = useAppSelector(
    (state) => state.style.navBarItemLabelActiveColorStyle
  )
  const navBarItemLabelStyle = useAppSelector((state) => state.style.navBarItemLabelStyle)
  const navBarItemLabelHoverStyle = useAppSelector((state) => state.style.navBarItemLabelHoverStyle)

  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const userName = `${currentUser?.firstName ? currentUser?.firstName : ""} ${currentUser?.lastName ? currentUser?.lastName : ""}`;

  const [isDropdownActive, setIsDropdownActive] = useState(false)

  useEffect(() => {
    return () => setIsDropdownActive(false);
  }, [router.pathname]);

  const componentClass = [
    'block lg:flex items-center relative cursor-pointer',
    isDropdownActive
      ? `${navBarItemLabelActiveColorStyle} dark:text-slate-400`
      : `${navBarItemLabelStyle} dark:text-white dark:hover:text-slate-400 ${navBarItemLabelHoverStyle}`,
    item.menu ? 'lg:py-2 lg:px-3' : 'py-2 px-3',
    item.isDesktopNoLabel ? 'lg:w-16 lg:justify-center' : '',
  ].join(' ')

  const itemLabel = item.isCurrentUser ? userName : item.label

  const handleMenuClick = () => {
    if (item.menu) {
      setIsDropdownActive(!isDropdownActive)
    }

    if (item.isToggleLightDark) {
      dispatch(setDarkMode(null))
    }

    if(item.isLogout) {
      dispatch(logoutUser())
      router.push('/login')
    }
  }

    const getItemId = (label) => {
    switch (label) {
      case 'Light/Dark':
        return 'themeToggle';
      case 'Log out':
        return 'logout';
      default:
        return undefined;
    }
  };

  const NavBarItemComponentContents = (
    <>
      <div
        id={getItemId(itemLabel)}
        className={`flex items-center ${
          item.menu
            ? 'bg-gray-100 dark:bg-dark-800 lg:bg-transparent lg:dark:bg-transparent p-3 lg:p-0'
            : 'w-full'
        }`}
        onClick={handleMenuClick}
      >
        {item.icon && <BaseIcon path={item.icon} size={22} className="transition-colors" />}
        <span
          className={`px-2 transition-colors w-40 grow ${
            item.isDesktopNoLabel && item.icon ? 'lg:hidden' : ''
          }`}
        >
          {itemLabel}
        </span>
        {item.isCurrentUser && <UserAvatarCurrentUser className="w-6 h-6 mr-3 inline-flex" />}
        {item.menu && (
          <BaseIcon
            path={isDropdownActive ? mdiChevronUp : mdiChevronDown}
            className="hidden lg:inline-flex transition-colors"
          />
        )}
      </div>
      {item.menu && (
        <div
          className={`${
            !isDropdownActive ? 'lg:hidden' : ''
          } text-sm border-b border-gray-100 lg:border lg:bg-white lg:absolute lg:top-full lg:left-0 lg:min-w-full lg:z-20 lg:rounded-lg lg:shadow-lg lg:dark:bg-dark-900 dark:border-dark-700`}
        >
          <ClickOutside onClickOutside={() => setIsDropdownActive(false)} excludedElements={[excludedRef]}>
            <NavBarMenuList menu={item.menu} />
          </ClickOutside>
        </div>
      )}
    </>
  )

  if (item.isDivider) {
    return <BaseDivider navBar />
  }

  if (item.href) {
    return (
      <Link href={item.href} target={item.target} className={componentClass}>
        {NavBarItemComponentContents}
      </Link>
    )
  }

  return <div className={componentClass} ref={excludedRef}>{NavBarItemComponentContents}</div>
}
