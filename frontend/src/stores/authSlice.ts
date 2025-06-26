import { createSlice, createAsyncThunk, createAction } from '@reduxjs/toolkit';
import axios from 'axios';
import jwt from 'jsonwebtoken';

interface MainState {
  isFetching: boolean;
  errorMessage: string;
  currentUser: any;
  notify: any;
  token: string;
}

const initialState: MainState = {
  /* User */
  isFetching: false,
  errorMessage: '',
  currentUser: null,
  token: '',
  notify: {
    showNotification: false,
    textNotification: '',
    typeNotification: 'warn',
  },
};

export const resetAction = createAction('auth/passwordReset/reset')

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (creds: Record<string, string>, { rejectWithValue }) => {
      try {
        const response = await axios.post('auth/signin/local', creds);
        return response.data;
      } catch (error) {
        if (!error.response) {
          throw error;
        }
        return rejectWithValue(error.response.data);
      }
    }
);

export const passwordReset = createAsyncThunk(
    'auth/passwordReset',
    async (value: Record<string, string>, { rejectWithValue }) => {
      try {
        const { data: response } = await axios.put('/auth/password-reset', {
          token: value.token,
          password: value.password,
          type: value.type,
        });

        return response.data;
      } catch (error) {
        if (!error.response) {
          throw error;
        }

        return rejectWithValue(error.response.data);
      }
    },
);

export const findMe = createAsyncThunk('auth/findMe', async () => {
  const response = await axios.get('auth/me');
  return response.data;
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutUser: (state) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      axios.defaults.headers.common['Authorization'] = '';
      state.currentUser = null;
      state.token = '';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginUser.pending, (state) => {
      state.isFetching = true;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      const token = action.payload;
      const user = jwt.decode(token);

      state.errorMessage = '';
      state.token = token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    });

    builder.addCase(loginUser.rejected, (state, action) => {
      state.errorMessage = String(action.payload) || 'Something went wrong. Try again';
      state.isFetching = false;
    });
    builder.addCase(findMe.pending, () => {
      console.log('Pending findMe');
    });
    builder.addCase(findMe.fulfilled, (state, action) => {
      state.currentUser = action.payload;
      state.isFetching = false;
    });

    builder.addCase(passwordReset.fulfilled, (state, action) => {
      state.notify.showNotification = true;
      state.notify.textNotification = 'Password has been reset successfully';
    });

    builder.addCase(resetAction, (state) => initialState);

    builder.addCase(passwordReset.rejected, (state) => {
      state.errorMessage = 'Something was wrong. Try again';
    });
  },
});

// Action creators are generated for each case reducer function
export const { logoutUser } = authSlice.actions;

export default authSlice.reducer;
