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
import axios from "axios";

export default function Forgot() {
  const [loading, setLoading] = React.useState(false)
  const router = useRouter();
  const notify = (type, msg) => toast( msg, {type});

  const handleSubmit = async (value) => {
    setLoading(true)
    try {
      const { data: response } = await axios.post('/auth/send-password-reset-email', value);
      setLoading(false)
      notify('success', 'Please check your email for verification link');
      setTimeout(async () => {
        await router.push('/login')
      }, 3000)
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
            }}
            onSubmit={(values) => handleSubmit(values)}
          >
            <Form>
              <FormField label='Email' help='Please enter your email'>
                <Field name='email' />
              </FormField>

              <BaseDivider />

              <BaseButtons>
                <BaseButton
                  type='submit'
                  label={loading ? 'Loading...' : 'Submit' }
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

Forgot.getLayout = function getLayout(page: ReactElement) {
  return <LayoutGuest>{page}</LayoutGuest>;
};
