import { GridRenderEditCellParams, useGridApiContext } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MenuItem, Select } from '@mui/material';

interface Props {
  entityName: string;
}

const DataGridMultiSelect = (props: GridRenderEditCellParams & Props) => {
  const { id, value, field, entityName } = props;
  const apiRef = useGridApiContext();
  const [options, setOptions] = useState([]);

  async function callApi(entityName: string) {
    const data = await axios(`/${entityName}/autocomplete?limit=100`);
    return data.data;
  }

  useEffect(() => {
    callApi(entityName).then((data) => {
      setOptions(data);
    });
  }, []);

  const handleChange = (event) => {
    const eventValue = event.target.value; // The new value entered by the user

    const newValue =
      typeof eventValue === 'string' ? value.split(',') : eventValue;

    apiRef.current.setEditCellValue({
      id,
      field,
      value: newValue.filter((x) => x !== ''),
    });
  };

  return (
    <Select
      multiple
      value={value ?? []}
      onChange={handleChange}
      sx={{ width: '100%' }}
    >
      {options.map((option) => (
        <MenuItem key={option.id} value={option.id}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
};

export default DataGridMultiSelect;
