import React from 'react';
import {
  mdiChevronDoubleLeft,
  mdiChevronDoubleRight,
  mdiChevronLeft,
  mdiChevronRight,
} from '@mdi/js';
import BaseIcon from './BaseIcon';

type Props = {
  currentPage: number;
  numPages: number;
  setCurrentPage: any;
};

export const Pagination = ({
  currentPage,
  numPages,
  setCurrentPage,
}: Props) => {
  return (
    <div className='flex items-center'>
      {currentPage === 0 && (
        <div className='flex'>
          <BaseIcon
            path={mdiChevronDoubleLeft}
            className='mr-2 text-brand-600 border-2 border-brand-600 rounded-full'
          />
          <BaseIcon
            path={mdiChevronLeft}
            className='mr-2 text-brand-600 border-2 border-brand-600 rounded-full'
          />
        </div>
      )}
      {currentPage !== 0 && (
        <div className='flex'>
          <div onClick={() => setCurrentPage(0)}>
            <BaseIcon
              path={mdiChevronDoubleLeft}
              className='mr-2 text-brand-900 cursor-pointer h-full border-2 border-brand-900 rounded-full'
            />
          </div>
          <div onClick={() => setCurrentPage(currentPage - 1)}>
          <BaseIcon
              path={mdiChevronLeft}
              className='mr-2 text-brand-900 cursor-pointer h-full border-2 border-brand-900 rounded-full'
            />
          </div>
        </div>
      )}
      <p className='text-base text-gray-1 mt-6 md:mt-0'>
        Page {currentPage + 1} of {numPages}
      </p>
      {currentPage !== numPages - 1 && (
        <div className='flex'>
          <div onClick={() => setCurrentPage(currentPage + 1)}>
            <BaseIcon
              path={mdiChevronRight}
              className='ml-2 text-brand-900 cursor-pointer h-full border-2 border-brand-900 rounded-full'
            />
          </div>

          <div onClick={() => setCurrentPage(numPages - 1)}>
            <BaseIcon
              path={mdiChevronDoubleRight}
              className='ml-2 text-brand-900 cursor-pointer h-full border-2 border-brand-900 rounded-full'
            />
          </div>
        </div>
      )}
      {currentPage === numPages - 1 && (
        <div className='flex'>
          <BaseIcon
            path={mdiChevronRight}
            className='ml-2 text-brand-600 border-2 border-brand-600 rounded-full'
          />
          <BaseIcon
            path={mdiChevronDoubleRight}
            className='ml-2 text-brand-600 border-2 border-brand-600 rounded-full'
          />
        </div>
      )}
    </div>
  );
};
