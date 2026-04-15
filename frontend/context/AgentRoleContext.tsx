import { createContext, useContext, useState } from 'react';

type AgentRoleContextType = {
  roleAgent: string | null | undefined; // undefined = en cours de chargement, null = pas de rôle
  setRoleAgent: (role: string | null) => void;
};

const AgentRoleContext = createContext<AgentRoleContextType>({
  roleAgent: undefined,
  setRoleAgent: () => {},
});

export const AgentRoleProvider = ({ children }: { children: React.ReactNode }) => {
  const [roleAgent, setRoleAgent] = useState<string | null | undefined>(undefined);

  return (
    <AgentRoleContext.Provider value={{ roleAgent, setRoleAgent }}>
      {children}
    </AgentRoleContext.Provider>
  );
};

export const useAgentRole = () => useContext(AgentRoleContext);
