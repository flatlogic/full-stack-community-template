import React, { useState, useEffect } from 'react';
import useDevCompilationStatus from '../hooks/useDevCompilationStatus';
const DevModeBadge: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const compilationStatus = useDevCompilationStatus();

    const [badgeStyles, setBadgeStyles] = useState<React.CSSProperties>({
        position: 'fixed',
        bottom: '20px',
        left: '70px',
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        textAlign: 'left',
        zIndex: 2147483647,
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
        whiteSpace: 'pre-wrap',
        transition: 'width 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), padding 0.3s ease-in-out, opacity 0.3s ease-in-out, background-color 0.3s ease-in-out', // Improved transition for width
        opacity: 0,
        pointerEvents: 'none',
        width: '340px',
        maxWidth: '340px',
        height: 'auto',
        overflow: 'hidden',
        cursor: 'pointer',
    });

    const fullText = `🚧 Your app is running in development mode.
Current request is compiling and may take a few moments.

💡 Tip: Set up a stable environment to run your app in production mode—pages will load instantly without compilation delays.`;

    const collapsedText = '🚧 DEV stage';

    useEffect(() => {
        if (compilationStatus === 'ready') {
            setIsCollapsed(true);
        } else {
            setIsCollapsed(false);
        }

    }, [compilationStatus]);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev_stage') {
            setIsVisible(true);

            setBadgeStyles(prev => ({
                ...prev,
                opacity: 1,
                width: '120px',
                maxWidth: '120px',
                padding: '6px 10px',
                borderRadius: '18px',
                whiteSpace: 'nowrap',
                fontSize: '12px',
                cursor: 'pointer',
                pointerEvents: 'auto',
            }));

        } else {
            setIsVisible(false);
            setBadgeStyles(prev => ({ ...prev, opacity: 0 }));
        }
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        if (isCollapsed) {
            setBadgeStyles(prev => ({
                ...prev,
                width: '140px',
                maxWidth: '160px',
                padding: '6px 20px',
                borderRadius: '18px',
                whiteSpace: 'nowrap',
                fontSize: '12px',
            }));
        } else {
            setBadgeStyles(prev => ({
                ...prev,
                width: '340px',
                maxWidth: '340px',
                padding: '15px',
                borderRadius: '8px',
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
            }));
        }
    }, [isCollapsed, isVisible]);

    const handleToggleCollapse = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsCollapsed(prev => !prev);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div style={badgeStyles} onClick={isCollapsed ? handleToggleCollapse : undefined}>
            <button
                onClick={handleToggleCollapse}
                style={{
                    position: 'absolute',
                    top: isCollapsed ? '3px' : '5px',
                    right: isCollapsed ? '2px' : '5px',
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: isCollapsed ? '10px' : '18px',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1',
                    width: '24px',
                    height: isCollapsed ? '24px' : '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transition: 'background-color 0.2s ease, font-size 0.2s ease, width 0.2s ease, height 0.2s ease',
                }}
                aria-label={isCollapsed ? "Expand message" : "Collapse message"}
            >
                {isCollapsed ? '+' : '×'}
            </button>

            {!isCollapsed && (
                <div style={{ marginRight: '20px' }}>
                    {fullText}
                </div>
            )}
            {isCollapsed && (
                <div style={{ marginRight: '10px' }}>
                    {collapsedText}
                </div>
            )}
        </div>
    );
};

export default DevModeBadge;
