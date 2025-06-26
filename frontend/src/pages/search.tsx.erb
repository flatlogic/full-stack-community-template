import React, { ReactElement, useEffect, useState } from 'react';
import Head from 'next/head';
import 'react-datepicker/dist/react-datepicker.css';
import { useAppDispatch } from '../stores/hooks';
import { useRouter } from 'next/router';
import LayoutAuthenticated from '../layouts/Authenticated';
import SectionTitleLineWithButton from '../components/SectionTitleLineWithButton';
import SectionMain from '../components/SectionMain';
import CardBox from '../components/CardBox';
import SearchResults from '../components/SearchResults';
import LoadingSpinner from '../components/LoadingSpinner';
import BaseButton from '../components/BaseButton';
import BaseDivider from '../components/BaseDivider';
import { mdiChartTimelineVariant } from '@mdi/js';
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const SearchView = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchQuery = router.query.query;
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    dispatch(fetchData());
  }, [dispatch, searchQuery]);

  const fetchData = createAsyncThunk('/search', async () => {
    setLoading(true);
    try {
      const response = await axios.post('/search', { searchQuery });
      setSearchResults(response.data);
      setLoading(false);
      return response.data;
    } catch (error) {
      console.error(error.response);
      setLoading(false);
      throw error;
    }
  });

  const groupedResults = searchResults.reduce((acc, item) => {
    const { tableName } = item;
    acc[tableName] = acc[tableName] || [];
    acc[tableName].push(item);
    return acc;
  }, {});

  return (
    <>
      <Head>
        <title>Search Result</title>
      </Head>
      <SectionMain>
        <SectionTitleLineWithButton
          icon={mdiChartTimelineVariant}
          title={'Search Result'}
          main
        >
          {''}
        </SectionTitleLineWithButton>
        <CardBox>
        {loading ? <LoadingSpinner /> : <SearchResults
            searchResults={groupedResults}
            searchQuery={searchQuery}
          />}
          <BaseDivider />
          <BaseButton
            color='info'
            label='Back'
            onClick={() => router.push('/dashboard')}
          />
        </CardBox>
      </SectionMain>
    </>
  );
};

SearchView.getLayout = function getLayout(page: ReactElement) {
  return (
    <LayoutAuthenticated>{page}</LayoutAuthenticated>
  );
};

export default SearchView;
