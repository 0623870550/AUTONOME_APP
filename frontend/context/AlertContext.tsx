import { createContext, useContext, useState } from 'react';

type AlertContextType = {
  alert: string | null;
  setAlert: (value: string | null) => void;
};

const AlertContext = createContext<AlertContextType>({
  alert: null,
  setAlert: () => {},
});

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [alert, setAlert] = useState<string | null>(null);

  return (
    <AlertContext.Provider value={{ alert, setAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
