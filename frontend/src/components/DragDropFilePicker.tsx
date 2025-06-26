import React, { ChangeEvent, useEffect, useState } from 'react';
import BaseIcon from './BaseIcon';
import { mdiFileUploadOutline } from '@mdi/js';

type Props = {
  file: File | null;
  setFile: (file: File) => void;
  formats?: string;
};

const DragDropFilePicker = ({ file, setFile, formats = '' }: Props) => {
  const [highlight, setHighlight] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInput = React.createRef<HTMLInputElement>();

  useEffect(() => {
    if (!file && fileInput) fileInput.current.value = '';
  }, [file, fileInput]);

  function onFilesAdded(files: FileList | null) {
    if (files && files[0]) {
      const newFile = files[0];
      const fileExtension = newFile.name.split('.').pop().toLowerCase();

      if (formats.includes(fileExtension) || !formats) {
        setFile(newFile);
        setErrorMessage('');
      } else {
        setErrorMessage(`Allowed formats: ${formats}`);
      }
    }
  }

  function onDragOver(e) {
    e.preventDefault();
    setHighlight(true);
  }

  function onDragLeave() {
    setHighlight(false);
  }

  function onDrop(e) {
    e.preventDefault();

    const files = e.dataTransfer.files;

    onFilesAdded(files);
    setHighlight(false);
  }

  const onClear = () => {
    setFile(null);
    setErrorMessage('');
  };

  return (
    <div
      className='flex items-center justify-center w-full mb-4'
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <label
        htmlFor='dropzone-file'
        className={`
          flex flex-col items-center justify-center w-full h-64
          border-2 border-dashed rounded-lg cursor-pointer
          bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100
          dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600
          ${
            highlight
              ? 'border-brand-blue dark:border-brand-blue'
              : 'border-brand-600'
          }
        `}
      >
        <div className='flex flex-col items-center justify-center pt-5 pb-6'>
          <BaseIcon
            path={mdiFileUploadOutline}
            size={34}
            className={`${
              file ? 'text-brand-blue' : 'text-brand-600'
            } mx-auto mb-2`}
          />
          {errorMessage && (
            <p className='mb-2 text-sm text-red-600 dark:text-red-600'>
              {errorMessage}
            </p>
          )}
          {file ? (
            <div className='px-4 py-2 max-w-full flex-grow-0 overflow-x-hidden bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 border rounded'>
              <span className='text-ellipsis max-w-full line-clamp-1'>
                {file.name}
              </span>
            </div>
          ) : (
            <>
              <p className='mb-2 text-sm text-gray-500 dark:text-gray-400'>
                <span className='font-semibold'>Click to upload</span> or drag
                and drop
              </p>
              {formats && (
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {formats}
                </p>
              )}
            </>
          )}
        </div>
        <input
          id='dropzone-file'
          ref={fileInput}
          type='file'
          accept={formats}
          className='hidden'
          onChange={(e) => onFilesAdded(e.target.files)}
        />
      </label>
    </div>
  );
};

export default DragDropFilePicker;
