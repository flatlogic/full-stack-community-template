import React from 'react';
import CardBox from './CardBox';
import { useRouter } from 'next/router';
import { humanize } from '../helpers/humanize';

const SearchResults = ({ searchResults, searchQuery }) => {
  const router = useRouter();

  return (
    <>
      <p className={'block font-bold mb-2'}>Matches with: {searchQuery}</p>
      {Object.keys(searchResults).map((tableName) => (
        <>
          <p className={'block font-bold mb-2'}>{humanize(tableName)}</p>
          <CardBox
            className='mb-6 border border-gray-300 rounded overflow-hidden'
            hasTable
            key={tableName}
          >
            <div className='overflow-x-auto'>
              <table>
                <thead>
                  <tr>
                    {searchResults[tableName].length > 0 &&
                      Object.keys(searchResults[tableName][0]).map((key) => {
                        if (
                          key !== 'tableName' &&
                          key !== 'id' &&
                          key !== 'matchAttribute'
                        ) {
                          return (
                            <th data-label={key} key={key}>
                              {humanize(key)}
                            </th>
                          );
                        }
                        return null;
                      })}
                  </tr>
                </thead>
                <tbody>
                  {searchResults[tableName].map((item, index) => (
                    <tr key={index}>
                      {Object.keys(item).map((key) => {
                        if (
                          key !== 'tableName' &&
                          key !== 'id' &&
                          key !== 'matchAttribute'
                        ) {
                          return (
                            <td
                              key={key}
                              onClick={() =>
                                router.push(
                                  `/${tableName}/${tableName}-view/?id=${item['id']}`,
                                )
                              }
                            >
                              {item[key]}
                            </td>
                          );
                        }
                        return null;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!Object.keys(searchResults).length && (
              <div className={'text-center py-4'}>No data</div>
            )}
          </CardBox>
        </>
      ))}
      {!Object.keys(searchResults).length && (
        <div className={'py-4'}>No matches</div>
      )}
    </>
  );
};

export default SearchResults;
