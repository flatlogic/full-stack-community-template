import {
    mdiChartTimelineVariant,
    mdiUpload,
} from '@mdi/js';
import Head from 'next/head';
import React, { ReactElement, useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
import FormCheckRadio from '../components/FormCheckRadio';
import FormCheckRadioGroup from '../components/FormCheckRadioGroup';
import FormImagePicker from '../components/FormImagePicker';
import { SwitchField } from '../components/SwitchField';
import { SelectField } from '../components/SelectField';

import { update, fetch } from '../stores/users/usersSlice';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { useRouter } from 'next/router';
import {findMe} from "../stores/authSlice";

const EditUsers = () => {
    const { currentUser, isFetching, token } = useAppSelector(
        (state) => state.auth,
    );
    const router = useRouter();
    const dispatch = useAppDispatch();
    const notify = (type, msg) => toast(msg, { type });
    const initVals = {
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        app_role: '',
        disabled: false,
        avatar: [],
        password: ''
    };
    const [initialValues, setInitialValues] = useState(initVals);

    useEffect(() => {
        if (currentUser?.id && typeof currentUser === 'object') {
            const newInitialVal = { ...initVals };

            Object.keys(initVals).forEach(
                (el) => (newInitialVal[el] = currentUser[el]),
            );

            setInitialValues(newInitialVal);
        }
    }, [currentUser]);

    const handleSubmit = async (data) => {
        await dispatch(update({ id: currentUser.id, data }));
        await dispatch(findMe());
        await router.push('/users/users-list');
        notify('success', 'Profile was updated!');
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
                                <Field name='email' placeholder='E-Mail' disabled />
                            </FormField>

                            <FormField label='App Role' labelFor='app_role'>
                              <Field
                                name='app_role'
                                id='app_role'
                                component={SelectField}
                                options={initialValues.app_role}
                                itemRef={'roles'}
                                showField={'name'}
                              ></Field>
                            </FormField>

                            <FormField label='Disabled' labelFor='disabled'>
                                <Field
                                    name='disabled'
                                    id='disabled'
                                    component={SwitchField}
                                ></Field>
                            </FormField>

                            <FormField
                                label="Password"
                            >
                                <Field
                                    name="password"
                                    placeholder="password"
                                />
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
            </SectionMain>
        </>
    );
};

EditUsers.getLayout = function getLayout(page: ReactElement) {
    return <LayoutAuthenticated>{page}</LayoutAuthenticated>;
};

export default EditUsers;
