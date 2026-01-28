import { createContext, useContext, useState } from 'react';

type AgentRoleContextType = {
  roleAgent: string | null;
  setRoleAgent: (role: string | null) => void;
};

const AgentRoleContext = createContext<AgentRoleContextType>({
  roleAgent: null,
  setRoleAgent: () => {},
});

export const AgentRoleProvider = ({ children }: { children: React.ReactNode }) => {
  const [roleAgent, setRoleAgent] = useState<string | null>(null);

  return (
    <AgentRoleContext.Provider value={{ roleAgent, setRoleAgent }}>
      {children}
    </AgentRoleContext.Provider>
  );
};

export const useAgentRole = () => useContext(AgentRoleContext);
