import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import AdminPage from './pages/AdminPage/AdminPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import NotFound from './pages/NotFound/NotFound';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
