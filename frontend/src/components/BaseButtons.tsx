import { Children, cloneElement, ReactElement } from 'react';
import type { ReactNode } from 'react';

type Props = {
  type?: string;
  mb?: string;
  noWrap?: boolean;
  classAddon?: string;
  children?: ReactNode;
  className?: string;
};

const BaseButtons = ({
                       type = 'justify-end',
                       mb = '-mb-3',
                       classAddon = 'mr-3 last:mr-0 mb-3',
                       noWrap = false,
                       children,
                       className,
                     }: Props) => {
  return (
      <div
          className={`flex items-center ${type} ${className} ${mb} ${
              noWrap ? 'flex-nowrap' : 'flex-wrap'
          }`}
      >
        {Children.map(children, (child: ReactElement) =>
            child
                ? cloneElement(child as ReactElement<{ className?: string }>, {
                  className: `${classAddon} ${(child.props as { className?: string }).className || ''}`,
                })
                : null,
        )}
      </div>
  );
};

export default BaseButtons;
