import React from 'react';
import type { ReactElement } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import Head from 'next/head';
import BaseButton from '../components/BaseButton';
import CardBox from '../components/CardBox';
import SectionFullScreen from '../components/SectionFullScreen';
import LayoutGuest from '../layouts/Guest';
import { Field, Form, Formik } from 'formik';
import FormField from '../components/FormField';
import BaseDivider from '../components/BaseDivider';
import BaseButtons from '../components/BaseButtons';
import { useRouter } from 'next/router';
import { getPageTitle } from '../config';
import Select from 'react-select';
import axios from "axios";

export default function Register() {
    const [loading, setLoading] = React.useState(false);
    const router = useRouter();
    const notify = (type, msg) => toast( msg, {type, position: "bottom-center"});

    const handleSubmit = async (value) => {
        setLoading(true)
        try {
            const { data: response } = await axios.post('/auth/signup', value);
            await router.push('/login')
            setLoading(false)
            notify('success', 'Please check your email for verification link')
        } catch (error) {
            setLoading(false)
            console.log('error: ', error)
            notify('error', 'Something was wrong. Try again')
        }
    };

    return (
        <>
            <Head>
                <title>{getPageTitle('Login')}</title>
            </Head>

            <SectionFullScreen bg='violet'>
                <CardBox className='w-11/12 md:w-7/12 lg:w-6/12 xl:w-4/12'>
                    <Formik
                        initialValues={{
                            email: '',
                            password: '',
                            confirm: ''
                        }}
                        onSubmit={(values) => handleSubmit(values)}
                    >
                        <Form>
                            <FormField label='Email' help='Please enter your email'>
                                <Field type='email' name='email' />
                            </FormField>
                            <FormField label='Password' help='Please enter your password'>
                                <Field type='password' name='password' />
                            </FormField>
                            <FormField label='Confirm Password' help='Please confirm your password'>
                                <Field type='password' name='confirm' />
                            </FormField>

                            <BaseDivider />

                            <BaseButtons>
                                <BaseButton
                                    type='submit'
                                    label={loading ? 'Loading...' : 'Register' }
                                    color='info'
                                />
                                <BaseButton
                                    href={'/login'}
                                    label={'Login'}
                                    color='info'
                                />
                            </BaseButtons>
                        </Form>
                    </Formik>
                </CardBox>
            </SectionFullScreen>
            <ToastContainer />
        </>
    );
}

Register.getLayout = function getLayout(page: ReactElement) {
    return <LayoutGuest>{page}</LayoutGuest>;
};
