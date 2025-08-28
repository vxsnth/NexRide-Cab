import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type User = {
  name: string;
  email: string;
  gender: string;
  role: string; // 'rider' or 'driver'
  avatar: any;
  phone?: string;
  experience?: string;
  rating?: number;
};

type UserContextType = {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextType | null>(null);

type Props = { children: ReactNode };

export const UserProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User>({
    name: '',
    email: '',
    gender: '',
    role: '',
    avatar: null,
    phone: '',
    experience: '',
    rating: 4.5,
  });

  // Load saved user when app starts
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    loadUser();
  }, []);

  // Save user whenever it changes
  useEffect(() => {
    AsyncStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  const updateUser = async (updates: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const logout = async () => {
    setUser({
      name: '',
      email: '',
      gender: '',
      role: '',
      avatar: null,
      phone: '',
      experience: '',
      rating: 4.5,
    });
    await AsyncStorage.removeItem('user');
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
