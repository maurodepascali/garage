import { createContext, useState } from 'react';

export const GarageContext = createContext();

export const GarageProvider = ({ children }) => {
  const [garages, setGarages] = useState([]);

  const addGarage = (newGarage) => {
    setGarages([...garages, newGarage]);
  };

  return (
    <GarageContext.Provider value={{ garages, addGarage }}>
      {children}
    </GarageContext.Provider>
  );
};