import React from 'react';
import type { ReactElement } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import Head from 'next/head';
import CardBox from '../components/CardBox';
import SectionFullScreen from '../components/SectionFullScreen';
import LayoutGuest from '../layouts/Guest';
import { useRouter } from 'next/router';
import { getPageTitle } from '../config';
import axios from 'axios';

export default function Verify() {
    const [loading, setLoading] = React.useState(false);
    const router = useRouter();
    const [token, setToken] = React.useState('');
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.hash.slice(1));
        if (params.has('token')) {
            setToken(params.get('token') || '');
            window.history.replaceState(window.history.state, '', window.location.pathname);
        }
    }, []);

    const verifyEmail = async () => {
        setLoading(true);
        try {
            await axios.put('/auth/verify-email', { token });
            await router.push('/login');
        } catch {
            toast.error('This link is invalid or has expired. Request a new link from the password recovery page.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>{getPageTitle('Verify Email')}</title>
            </Head>
            <SectionFullScreen bg='violet'>
                <CardBox className='w-11/12 md:w-7/12 lg:w-6/12 xl:w-4/12'>
                    <p>Confirm that you registered this address to finish setting up your account.</p>
                        <button type='button' disabled={!token || loading} onClick={verifyEmail}>
                            {loading ? 'Verifying…' : 'Verify email'}
                        </button>
                </CardBox>
            </SectionFullScreen>

            <ToastContainer />
        </>
    );
}

Verify.getLayout = function getLayout(page: ReactElement) {
    return <LayoutGuest>{page}</LayoutGuest>;
};
