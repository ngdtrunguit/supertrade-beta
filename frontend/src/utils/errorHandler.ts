
// 6. src/utils/errorHandler.ts
export const handleApiError = (error: any): string => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || 'An unexpected error occurred';
    }
    return 'Network error. Please try again.';
  };