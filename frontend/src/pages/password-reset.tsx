import React from 'react';
import type { ReactElement } from 'react';
import LayoutGuest from '../layouts/Guest';
import PasswordSetOrReset from '../components/PasswordSetOrReset';

export default function Reset() {
  return <PasswordSetOrReset />;
}

Reset.getLayout = function getLayout(page: ReactElement) {
  return <LayoutGuest>{page}</LayoutGuest>;
};
