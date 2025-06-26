/* eslint-disable @next/next/no-img-element */
// Why disabled:
// avatars.dicebear.com provides svg avatars
// next/image needs dangerouslyAllowSVG option for that

import React, { ReactNode } from 'react';
import BaseIcon from "./BaseIcon";
import {mdiAccountCircleOutline} from "@mdi/js";

type Props = {
  username: string;
  avatar?: string | null;
  image?: object | null;
  api?: string;
  className?: string;
  children?: ReactNode;
};

export default function UserAvatar({
                                     username,
                                     image,
                                     avatar,
                                     className = '',
                                     children,
                                   }: Props) {

  const avatarImage = (image && image[0]) ? `${image[0].publicUrl}` : '#';

  return (
      <div id="profilEdit" className={className}>
          {avatarImage === "#"
              ? <BaseIcon
                  path={mdiAccountCircleOutline}
                  size={30}
                  className={'dark:text-white dark:hover:text-slate-400 hover:text-black transition-colors'}
              />
              : <img
                  src={avatarImage}
                  alt={username}
                  className='rounded-full block h-auto w-full max-w-full bg-gray-100 dark:bg-slate-800'
              />
          }
        {children}
      </div>
  );
}
