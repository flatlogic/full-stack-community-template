import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className='flex items-center justify-center h-40'>
      <div className='relative w-12'>
        <div
          className='w-12 h-12 rounded-full absolute border-4 border-solid border-gray-200 dark:border-slate-800'
        ></div>
        <div
          className="w-12 h-12 rounded-full animate-spin absolute border-4 border-solid border-blue-500 dark:border-blue-500 border-t-transparent"
        ></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;