import React from 'react';
import Landing from './pages/Landing';
import { Navigate, Route, Routes, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Bookings from './pages/app/Bookings';
import Dashboard from './pages/app/Dashboard';
import PublicContact from './pages/public/PublicContact';
import PublicBooking from './pages/public/PublicBooking';
import PublicFormsForBooking from './pages/public/PublicFormsForBooking';
import PublicFormFill from './pages/public/PublicFormFill';
import { RequireActiveOrOnboarding, RequireAuth, RequireWorkspace } from './components/RouteGuards';
import AppShell from './components/AppShell';
import Workspaces from './pages/app/Workspaces';
import Onboarding from './pages/app/Onboarding';
import Inbox from './pages/app/Inbox';
import Forms from './pages/app/Forms';
import Inventory from './pages/app/Inventory';
import { Toaster } from 'react-hot-toast';
import Staff from './pages/app/Staff';

const App = () => {
  return (
    <>


      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#171717",      // neutral-900
            color: "#f5f5f5",           // neutral-100
            border: "1px solid #262626", // neutral-800
            fontFamily: "monospace",
            fontSize: "13px",
          },
          success: {
            iconTheme: { primary: "#4ade80", secondary: "#171717" }, // emerald-400
          },
          error: {
            iconTheme: { primary: "#f87171", secondary: "#171717" }, // red-400
          },
        }}
      />

      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />


        {/* Public (no login) */}
        <Route path='/w/:slug/contact' element={<PublicContact />} />
        <Route path='/w/:slug/book' element={<PublicBooking />} />
        <Route path='/w/:slug/forms/:bookingId' element={<PublicFormsForBooking />} />
        <Route path='/form/:token' element={<PublicFormFill />} />

        {/* App */}
        <Route element={<RequireAuth />}>
          <Route path="/app" element={<AppShell><Outlet /></AppShell>}>
            <Route index element={<Navigate to="workspaces" replace />} />
            <Route path="workspaces" element={<Workspaces />} />
            <Route element={<RequireWorkspace />}>
              <Route path="onboarding" element={<Onboarding />} />
              <Route element={<RequireActiveOrOnboarding />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="inbox" element={<Inbox />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="forms" element={<Forms />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path='staff' element={<Staff />} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<div className="p-6 text-sm text-neutral-600">Not found</div>} />
      </Routes>
    </>
  );
}

export default App;
