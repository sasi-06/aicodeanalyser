import { createSlice } from '@reduxjs/toolkit';

const sessionSlice = createSlice({
  name: 'session',
  initialState: {
    currentSession: null,
    question: null,
    starterCode: '',
    telemetryStats: { totalKeystrokes: 0, totalPasteCount: 0, compilationCount: 0, averagePause: 0 },
    submissionResult: null,
    loading: false,
  },
  reducers: {
    setSession: (state, { payload }) => { state.currentSession = payload; },
    setQuestion: (state, { payload }) => { state.question = payload; },
    setStarterCode: (state, { payload }) => { state.starterCode = payload; },
    updateTelemetryStats: (state, { payload }) => { state.telemetryStats = { ...state.telemetryStats, ...payload }; },
    setSubmissionResult: (state, { payload }) => { state.submissionResult = payload; },
    setLoading: (state, { payload }) => { state.loading = payload; },
    clearSession: (state) => {
      state.currentSession = null;
      state.question = null;
      state.starterCode = '';
      state.submissionResult = null;
      state.telemetryStats = { totalKeystrokes: 0, totalPasteCount: 0, compilationCount: 0, averagePause: 0 };
    },
  },
});

export const { setSession, setQuestion, setStarterCode, updateTelemetryStats, setSubmissionResult, setLoading, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
