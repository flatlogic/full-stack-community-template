import React, { ReactNode, useState, useEffect } from 'react'
import { mdiClose, mdiDotsVertical } from '@mdi/js'
import { containerMaxW } from '../config'
import BaseIcon from './BaseIcon'
import NavBarItemPlain from './NavBarItemPlain'
import NavBarMenuList from './NavBarMenuList'
import { MenuNavBarItem } from '../interfaces'
import {  useAppSelector } from '../stores/hooks';

type Props = {
  menu: MenuNavBarItem[]
  className: string
  children: ReactNode
}

export default function NavBar({ menu, className = '', children }: Props) {
  const [isMenuNavBarActive, setIsMenuNavBarActive] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false);
  const bgColor = useAppSelector((state) => state.style.bgLayoutColor);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 0;
      setIsScrolled(scrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleMenuNavBarToggleClick = () => {
    setIsMenuNavBarActive(!isMenuNavBarActive)
  }

  return (
    <nav
      className={`${className} top-0 inset-x-0 fixed ${bgColor} h-14 z-30 transition-position w-screen lg:w-auto dark:bg-dark-800`}
    >
      <div className={`flex lg:items-stretch ${containerMaxW} ${isScrolled && `border-b border-brand-400 dark:border-dark-700`}`}>
        <div className="flex flex-1 items-stretch h-14">{children}</div>
        <div className="flex-none items-stretch flex h-14 lg:hidden">
          <NavBarItemPlain onClick={handleMenuNavBarToggleClick}>
            <BaseIcon path={isMenuNavBarActive ? mdiClose : mdiDotsVertical} size="24" />
          </NavBarItemPlain>
        </div>
        <div
          className={`${
            isMenuNavBarActive ? 'block' : 'hidden'
          } flex items-center max-h-screen-menu overflow-y-auto lg:overflow-visible absolute w-screen top-14 left-0 ${bgColor}  shadow-lg lg:w-auto lg:flex lg:static lg:shadow-none dark:bg-dark-800`}
        >
          <NavBarMenuList menu={menu} />
        </div>
      </div>
    </nav>
  )
}
