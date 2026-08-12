export const isNetworkLikeError = (error) => {
  const message = error?.message || error?.error?.message || "";
  const code = error?.code || error?.status;
  return message === "Network Error" || code === "ERR_NETWORK" || code === undefined;
};

export const requestWithRetry = async (requestFn, { retries = 1, delayMs = 400 } = {}) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isNetworkLikeError(error)) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
};