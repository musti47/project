import { Navigate, Route, Routes } from 'react-router-dom';
import TablesAdmin from './pages/admin/TablesAdmin';
import Login from './pages/auth/Login';
import Settings from './pages/Settings';
import TableDetail from './pages/waiter/TableDetail';
import Tables from './pages/waiter/Tables';
import { isLoggedIn } from './utils/auth';

function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function App() {
  const loggedIn = isLoggedIn();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={loggedIn ? '/tables' : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/tables"
        element={
          <ProtectedRoute>
            <Tables />
          </ProtectedRoute>
        }
      />
      <Route
        path="/table/:id"
        element={
          <ProtectedRoute>
            <TableDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tables"
        element={
          <ProtectedRoute>
            <TablesAdmin />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={loggedIn ? '/tables' : '/login'} replace />} />
    </Routes>
  );
}

export default App;
