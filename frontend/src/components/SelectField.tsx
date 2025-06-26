import React, {useEffect, useId, useState} from 'react';
import { AsyncPaginate } from 'react-select-async-paginate';
import axios from 'axios'

export const SelectField = ({ options, field, form, itemRef, showField, disabled }) => {

  const [value, setValue] = useState(null)
  const PAGE_SIZE = 100;

  useEffect(() => {
    if(options?.id && field?.value?.id) {
      setValue({value: field.value?.id, label: field.value[showField]})
      form.setFieldValue(field.name, field.value?.id);
    } else if (!field.value) {
      setValue(null);
    }
  }, [options?.id, field?.value?.id, field?.value])

  const mapResponseToValuesAndLabels = (data) => ({
    value: data.id,
    label: data.label,
  })
  const handleChange = (option) => {
    form.setFieldValue(field.name, option?.value || null)
    setValue(option)
  }

  async function callApi(inputValue: string, loadedOptions: any[]) {
    const path = `/${itemRef}/autocomplete?limit=${PAGE_SIZE}&offset=${loadedOptions.length}${inputValue ? `&query=${inputValue}` : ''}`;
    const { data } = await axios(path);
    return {
      options: data.map(mapResponseToValuesAndLabels),
      hasMore: data.length === PAGE_SIZE,
    }
  }
  return (
      <AsyncPaginate
          classNames={{
            control: () => 'px-1 py-2',
          }}
          classNamePrefix='react-select'
          instanceId={useId()}
          value={value}
          debounceTimeout={1000}
          loadOptions={callApi}
          onChange={handleChange}
          defaultOptions
          isDisabled={disabled}
          isClearable
      />
  )
}

