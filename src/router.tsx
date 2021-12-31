import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { App } from './pages/app';
import { Friends } from './pages/friends';
import { Login } from './pages/login';
import { Profile } from './pages/profile';
import { Tasks } from './pages/tasks';
import { useProfileOrNull } from './profile-provider';

export const Router: React.VFC = () => {
  const profile = useProfileOrNull();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={profile ? <App /> : <Login />} />
        <Route path="/friends" element={profile ? <Friends /> : <Login />} />
        <Route path="/tasks" element={profile ? <Tasks /> : <Login />} />
        <Route path="/profile" element={profile ? <Profile /> : <Login />} />
      </Routes>
    </BrowserRouter>
  );
};
