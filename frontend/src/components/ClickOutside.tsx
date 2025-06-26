import React, { useCallback, useEffect, useRef, ReactNode, MutableRefObject } from 'react';

interface ClickOutsideProps {
    children?: ReactNode;
    onClickOutside: () => void;
    excludedElements: MutableRefObject<any>[];
}

const ClickOutside = ({ children, onClickOutside, excludedElements }: ClickOutsideProps) => {
    const wrapperRef = useRef(null);

    const handleClickOutside = useCallback(
        (event) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target) &&
                !excludedElements.some((el) => el.current.contains(event.target))
            ) {
                onClickOutside();
            }
        },
        [wrapperRef, onClickOutside, ...excludedElements],
    );

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    return <div ref={wrapperRef}>{children}</div>;
};

export default ClickOutside;
