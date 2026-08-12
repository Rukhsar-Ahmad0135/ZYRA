let authTokenGetter = null;

export const setAuthTokenGetter = (getter) => {
  authTokenGetter = getter;
};

export const getAuthToken = async () => {
  if (!authTokenGetter) {
    return null;
  }

  try {
    return await authTokenGetter();
  } catch {
    return null;
  }
};
