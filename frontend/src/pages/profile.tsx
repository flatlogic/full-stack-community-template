import {
    mdiChartTimelineVariant,
    mdiUpload,
} from '@mdi/js';
import Head from 'next/head';
import React, { ReactElement } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

import CardBox from '../components/CardBox';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionMain from '../components/SectionMain';
import SectionTitleLineWithButton from '../components/SectionTitleLineWithButton';
import { getPageTitle } from '../config';

import { Field, Form, Formik } from 'formik';
import FormField from '../components/FormField';
import BaseDivider from '../components/BaseDivider';
import BaseButtons from '../components/BaseButtons';
import BaseButton from '../components/BaseButton';
import FormImagePicker from '../components/FormImagePicker';

import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { useRouter } from 'next/router';
import { findMe } from '../stores/authSlice';

const EditUsers = () => {
    const { currentUser } = useAppSelector((state) => state.auth);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const initialValues = {
        firstName: currentUser?.firstName || '',
        lastName: currentUser?.lastName || '',
        phoneNumber: currentUser?.phoneNumber || '',
        avatar: currentUser?.avatar || [],
    };

    const handleSubmit = async (profile) => {
        try {
            await axios.put('/auth/profile', { profile });
            await dispatch(findMe()).unwrap();
            toast.success('Profile updated.');
        } catch (error) {
            toast.error(axios.isAxiosError(error) && typeof error.response?.data === 'string'
                ? error.response.data : 'Could not update your profile.');
        }
    };

    return (
        <>
            <Head>
                <title>{getPageTitle('Edit profile')}</title>
            </Head>
            <SectionMain>
                <SectionTitleLineWithButton
                    icon={mdiChartTimelineVariant}
                    title='Edit profile'
                    main
                >
                    {''}
                </SectionTitleLineWithButton>
                <CardBox>
                    <Formik
                        enableReinitialize
                        initialValues={initialValues}
                        onSubmit={(values) => handleSubmit(values)}
                    >
                        <Form>
                            <FormField>
                                <Field
                                    label='Avatar'
                                    color='info'
                                    icon={mdiUpload}
                                    path={'users/avatar'}
                                    name='avatar'
                                    id='avatar'
                                    schema={{
                                        size: undefined,
                                        formats: undefined,
                                    }}
                                    component={FormImagePicker}
                                ></Field>
                            </FormField>
                            <FormField label='First Name'>
                                <Field name='firstName' placeholder='First Name' />
                            </FormField>

                            <FormField label='Last Name'>
                                <Field name='lastName' placeholder='Last Name' />
                            </FormField>

                            <FormField label='Phone Number'>
                                <Field name='phoneNumber' placeholder='Phone Number' />
                            </FormField>

                            <FormField label='E-Mail'>
                                <input type='email' value={currentUser?.email || ''} disabled />
                            </FormField>

                            <BaseDivider />

                            <BaseButtons>
                                <BaseButton type='submit' color='info' label='Submit' />
                                <BaseButton type='reset' color='info' outline label='Reset' />
                                <BaseButton
                                    type='reset'
                                    color='danger'
                                    outline
                                    label='Cancel'
                                    onClick={() => router.push('/users/users-list')}
                                />
                            </BaseButtons>
                        </Form>
                    </Formik>
                </CardBox>
                <CardBox>
                    <Formik
                        initialValues={{ currentPassword: '', newPassword: '' }}
                        onSubmit={async (values, { resetForm }) => {
                            try {
                                await axios.put('/auth/password-update', values);
                                resetForm();
                                toast.success('Password changed.');
                            } catch (error) {
                                toast.error(axios.isAxiosError(error) && typeof error.response?.data === 'string'
                                    ? error.response.data : 'Could not change your password.');
                            }
                        }}
                    >
                        <Form>
                            <FormField label='Current password'>
                                <Field name='currentPassword' type='password' autoComplete='current-password' required />
                            </FormField>
                            <FormField label='New password'>
                                <Field name='newPassword' type='password' autoComplete='new-password' required />
                            </FormField>
                            <BaseButton type='submit' color='info' label='Change password' />
                        </Form>
                    </Formik>
                </CardBox>
            </SectionMain>
            <ToastContainer />
        </>
    );
};

EditUsers.getLayout = function getLayout(page: ReactElement) {
    return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default EditUsers;
