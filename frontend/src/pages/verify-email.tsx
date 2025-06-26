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
    const { token } = router.query;
    const notify = (type, msg) => toast(msg, { type });

    React.useEffect(() => {
        if (!token) {
            router.push('/login');
            return;
        }
        const handleSubmit = async () => {

            setLoading(true);
            await axios.put('/auth/verify-email', {
                token,
            }).then(verified => {
                if (verified) {
                    setLoading(false);
                    notify('success', 'Your email was verified');
                }
            }).catch(error => {
                setLoading(false);
                console.log('error: ', error);
                notify('error', error.response);
            }).finally(async () => {
                await router.push('/login');
            });
        };
        handleSubmit().then();
    }, [token]);

    return (
        <>
            <Head>
                <title>{getPageTitle('Verify Email')}</title>
            </Head>
            <SectionFullScreen bg='violet'>
                <CardBox className='w-11/12 md:w-7/12 lg:w-6/12 xl:w-4/12'>
                    <p>{loading ? 'Loading...' : ''}</p>
                </CardBox>
            </SectionFullScreen>

            <ToastContainer />
        </>
    );
}

Verify.getLayout = function getLayout(page: ReactElement) {
    return <LayoutGuest>{page}</LayoutGuest>;
};
