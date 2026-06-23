import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import sessionReducer from './sessionSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    session: sessionReducer,
  },
});

export default store;
