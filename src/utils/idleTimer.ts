// src/utils/idleTimer.ts

let idleTimeout: NodeJS.Timeout | null = null;
const timeoutDuration = 600000; // 10 minutes in milliseconds

const resetIdleTimer = () => {
  if (idleTimeout) {
    clearTimeout(idleTimeout);
  }
  idleTimeout = setTimeout(handleLogout, timeoutDuration);
};

const handleLogout = () => {
  console.log("User has been logged out due to inactivity");
  // Clear session tokens and state
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authState');
  localStorage.removeItem('userData');
  
  // Redirect to the login page
  window.location.href = '/login';
};

const startIdleTimer = () => {
  document.addEventListener('mousemove', resetIdleTimer);
  document.addEventListener('keydown', resetIdleTimer);
  document.addEventListener('click', resetIdleTimer);
  document.addEventListener('scroll', resetIdleTimer);
  document.addEventListener('touchstart', resetIdleTimer);

  resetIdleTimer();
};

const stopIdleTimer = () => {
  document.removeEventListener('mousemove', resetIdleTimer);
  document.removeEventListener('keydown', resetIdleTimer);
  document.removeEventListener('click', resetIdleTimer);
  document.removeEventListener('scroll', resetIdleTimer);
  document.removeEventListener('touchstart', resetIdleTimer);

  if (idleTimeout) {
    clearTimeout(idleTimeout);
    idleTimeout = null;
  }
};

export { startIdleTimer, stopIdleTimer };