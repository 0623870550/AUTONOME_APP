import React, { createContext, useContext, useState } from 'react';

type AlertContextType = {
  alert: boolean;
  triggerAlert: () => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [alert, setAlert] = useState(false);

  const triggerAlert = () => {
    setAlert(true);
    setTimeout(() => setAlert(false), 3000);
  };

  return (
    <AlertContext.Provider value={{ alert, triggerAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
