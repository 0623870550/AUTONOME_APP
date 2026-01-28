import { createContext, useContext, useState } from 'react';

type AgentPermissionContextType = {
  role: string | null;
  setRole: (role: string | null) => void;
};

const AgentPermissionContext = createContext<AgentPermissionContextType>({
  role: null,
  setRole: () => {},
});

export const AgentPermissionProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);

  return (
    <AgentPermissionContext.Provider value={{ role, setRole }}>
      {children}
    </AgentPermissionContext.Provider>
  );
};

export const useAgentPermission = () => useContext(AgentPermissionContext);
