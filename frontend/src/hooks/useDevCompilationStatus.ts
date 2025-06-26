import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

type CompilationStatus = 'ready' | 'compiling' | 'error' | 'initial';

const useDevCompilationStatus = (): CompilationStatus => {
    const router = useRouter();
    const [status, setStatus] = useState<CompilationStatus>('initial');

    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') {
            setStatus('ready');
            return;
        }

        const handleRouteChangeStart = () => {
            setStatus('compiling');
        };

        const handleRouteChangeComplete = () => {
            setTimeout(() => setStatus('ready'), 300);
        };

        const handleRouteChangeError = () => {
            setTimeout(() => setStatus('error'), 300);
        };

        router.events.on('routeChangeStart', handleRouteChangeStart);
        router.events.on('routeChangeComplete', handleRouteChangeComplete);
        router.events.on('routeChangeError', handleRouteChangeError);

        setStatus('ready');

        return () => {
            router.events.off('routeChangeStart', handleRouteChangeStart);
            router.events.off('routeChangeComplete', handleRouteChangeComplete);
            router.events.off('routeChangeError', handleRouteChangeError);
        };
    }, [router]);

    return status;
};

export default useDevCompilationStatus;