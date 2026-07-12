// Extracts a human-friendly message from our backend's ErrorResponse format
export function errorMessage(err, fallback = "Something went wrong") {
  const data = err.response?.data;
  if (!data) return "Cannot reach the server. Is the backend running?";
  if (data.fieldErrors) {
    // Take the first field error as the headline
    const first = Object.values(data.fieldErrors)[0];
    return first || data.message || fallback;
  }
  return data.message || fallback;
}

// Returns the fieldErrors map (or empty object) for inline display
export function fieldErrors(err) {
  return err.response?.data?.fieldErrors ?? {};
}