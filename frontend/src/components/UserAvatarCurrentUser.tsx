import React, {ReactNode, useEffect, useState} from 'react';
import { useAppSelector } from '../stores/hooks';
import UserAvatar from './UserAvatar';

type Props = {
  className?: string;
  children?: ReactNode;
};

export default function UserAvatarCurrentUser({
                                                className = '',
                                                children,
                                              }: Props) {
  const userName = useAppSelector((state) => state.main.userName);
  const userAvatar = useAppSelector((state) => state.main.userAvatar);
  const { currentUser, isFetching, token } = useAppSelector(
      (state) => state.auth,
  );
  const { users, loading } = useAppSelector((state) => state.users);

  const [ avatar, setAvatar ] = useState(null)

  useEffect(() => {
    currentUserAvatarCheck()
  }, []);

  useEffect(() => {
    currentUserAvatarCheck()
  }, [currentUser?.id, users]);

  const currentUserAvatarCheck = () => {
    if (currentUser?.id) {
      const image = currentUser?.avatar;
      setAvatar(image);
    }
  }

  return (
      <UserAvatar username={userName} avatar={userAvatar} className={className} image={avatar}>
        {children}
      </UserAvatar>
  );
}
