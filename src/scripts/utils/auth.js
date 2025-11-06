export const isLoggedIn = () => {
  return !!sessionStorage.getItem("token");
};

export const logout = () => {
  sessionStorage.removeItem("token");
  location.hash = "#/login";
};
