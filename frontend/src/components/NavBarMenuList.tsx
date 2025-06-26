import React from 'react'
import { MenuNavBarItem } from '../interfaces'
import NavBarItem from './NavBarItem'

type Props = {
  menu: MenuNavBarItem[]
}

export default function NavBarMenuList({ menu }: Props) {
  return (
    <>
      {menu.map((item, index) => (
          <div key={index}>
            <NavBarItem  item={item} />
          </div>
      ))}
    </>
  )
}
