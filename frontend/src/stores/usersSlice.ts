import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

interface MainState {
  users: any
  loading: boolean
  notify: {
    showNotification: boolean
    textNotification: string
    typeNotification: string
  }
}

const initialState: MainState = {
  users: [],
  loading: false,
  notify: {
    showNotification: false,
    textNotification: '',
    typeNotification: 'warn',
  },
}

export const fetch = createAsyncThunk('users/fetch', async (data: any) => {
  const { id, query } = data
  const result = await axios.get(
    `users${
      query || (id ? `/${id}` : '')
    }`
  )
  return id ? result.data : result.data.rows
})

export const deleteItem = createAsyncThunk('users/deleteUser', async (id: string, thunkAPI) => {
  try {
    await axios.delete(`users/${id}`)
    thunkAPI.dispatch(fetch({ id: '', query: '' }))
  } catch (error) {
    console.log(error)
  }

  // showNotification('Users has been deleted', 'success');
})

export const create = createAsyncThunk('users/createUser', async (data: any) => {
  const result = await axios.post(
    'users',
    { data }
  )
  // showNotification('Users has been created', 'success');
  return result.data
})

export const update = createAsyncThunk('users/updateUser', async (payload: any) => {
  const result = await axios.put(
    `users/${payload.id}`,
    { id: payload.id, data: payload.data }
  )
  return result.data
})

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetch.pending, (state) => {
      state.loading = true
    })
    builder.addCase(fetch.rejected, (state) => {
      state.loading = false
    })

    builder.addCase(fetch.fulfilled, (state, action) => {
      state.users = action.payload
      state.loading = false
    })

    builder.addCase(deleteItem.pending, (state) => {
      state.loading = true
    })

    builder.addCase(deleteItem.fulfilled, (state) => {
      state.loading = false
    })

    builder.addCase(deleteItem.rejected, (state) => {
      state.loading = false
    })

    builder.addCase(create.pending, (state) => {
      state.loading = true
    })
    builder.addCase(create.rejected, (state) => {
      state.loading = false
    })

    builder.addCase(create.fulfilled, (state) => {
      state.loading = false
    })

    builder.addCase(update.pending, (state) => {
      state.loading = true
    })
    builder.addCase(update.fulfilled, (state) => {
      state.loading = false
    })
    builder.addCase(update.rejected, (state) => {
      state.loading = false
    })
  },
})

// Action creators are generated for each case reducer function
// export const {  } = usersSlice.actions

export default usersSlice.reducer
