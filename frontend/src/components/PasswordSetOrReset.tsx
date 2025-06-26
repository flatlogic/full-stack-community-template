import React from 'react';
import {toast, ToastContainer} from 'react-toastify';

import Head from 'next/head';
import CardBox from '../components/CardBox';
import SectionFullScreen from '../components/SectionFullScreen';
import {useRouter} from 'next/router';
import {getPageTitle} from '../config';

import {Field, Form, Formik} from 'formik';
import FormField from '../components/FormField';
import BaseButtons from '../components/BaseButtons';
import BaseButton from '../components/BaseButton';
import { passwordReset } from '../stores/authSlice';
import {useAppDispatch} from '../stores/hooks';

export default function PasswordSetOrReset() {
    const [loading, setLoading] = React.useState(false);
    const [isInvitation, setIsInvitation] =  React.useState(false);
    const router = useRouter();
    const {token, invitation} = router.query;

    const notify = (type, msg) => toast(msg, {type});

    const dispatch = useAppDispatch();
    
    React.useEffect(() => {
        if (invitation) {
          setIsInvitation(true);
        }
      }, [invitation]);

    const handleSubmit = async (value) => {
        setLoading(true);
        if (typeof token === 'string') {
            await dispatch(
                passwordReset({
                    token,
                    password: value.password,
                    type: isInvitation && 'invitation',
                }),
            );
            await router.push('/login');
        }

        setLoading(false);
    };

    return (
        <>
            <Head>
                {isInvitation && <title>{getPageTitle('Set Password')}</title>}
                {!isInvitation && <title>{getPageTitle('Reset Password')}</title>}
            </Head>

            <SectionFullScreen bg='violet'>
                <div className='w-full flex flex-col items-center justify-center'>
                    <CardBox className='w-11/12 md:w-7/12 lg:w-6/12 xl:w-4/12'>
                        {isInvitation && <p className='text-xl mb-2'>Set Password</p>}
                        {!isInvitation && <p className='text-xl mb-2'>Reset Password</p>}
                        <p className='text-base mb-4'>Enter your new password</p>

                        <Formik
                            initialValues={{
                                password: '',
                                confirm: '',
                            }}
                            onSubmit={(values) => handleSubmit(values)}
                        >
                            {({errors, touched}) => (
                                <Form>
                                    <FormField
                                    >
                                        <Field
                                            type='password'
                                            name='password'
                                            placeholder='Password'
                                        />
                                    </FormField>
                                    <FormField
                                    >
                                        <Field
                                            type='password'
                                            name='confirm'
                                            placeholder='Confirm Password'
                                        />
                                    </FormField>

                                    <BaseButtons>
                                        <BaseButton
                                            className='w-full mt-3'
                                            type='submit'
                                            disabled={loading}
                                            label={
                                                loading
                                                    ? 'Loading...'
                                                    : isInvitation
                                                        ? 'Set Password'
                                                        : 'Reset Password'
                                            }
                                            color='info'
                                        />
                                    </BaseButtons>
                                </Form>
                            )}
                        </Formik>
                    </CardBox>
                </div>
            </SectionFullScreen>
            <ToastContainer/>
        </>
    );
}
