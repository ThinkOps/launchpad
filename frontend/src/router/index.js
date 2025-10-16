// src/AppRouter.jsx
import React, { useContext } from "react";
import { BrowserRouter as Router, Route, Routes, Switch, Redirect } from "react-router-dom";
import { AuthContext, AuthProvider } from "../context/AuthContext";
import { getUserPayload } from "config/helper";
// Views
import Login from "../views/Login";
import Home from "../views/Home";
import AdminPanel from "../views/AdminPanel";
import Teams from "../views/Teams";
import TeamDetails from "../views/Teams/TeamDetails";
import RolesManagement from "../views/Teams/RolesManagement";
import Applications from "../views/Applications";
import ApplicationDetails from "../views/Applications/ApplicationDetails";
import EnvironmentSecrets from "../views/Applications/EnvironmentSecrets";
import AuditLogs from "../views/AuditLogs";
import AppLayout from "../components/AppLayout";

import LoginContainer from "../containers/auth/LoginContainer";

// Define all routes in a map
const routes = [
    {
        name: "home",
        exact: true,
        path: "/home",
        component: Home,
    },
    {
        name: "admin",
        exact: true,
        path: "/admin",
        component: AdminPanel,
    },
    {
        name: "teams",
        exact: true,
        path: "/teams",
        component: Teams,
    },
    {
        name: "rolesManagement",
        exact: true,
        path: "/teams/roles",
        component: RolesManagement,
    },
    {
        name: "teamDetails",
        exact: true,
        path: "/teams/:teamId",
        component: TeamDetails,
    },
    {
        name: "applications",
        exact: true,
        path: "/applications",
        component: Applications,
    },
    {
        name: "applicationDetails",
        exact: true,
        path: "/applications/:applicationName",
        component: ApplicationDetails,
    },
    {
        name: "environmentSecrets",
        exact: true,
        path: "/applications/:applicationName/environments/:environmentName",
        component: EnvironmentSecrets,
    },
    {
        name: "auditLogs",
        exact: true,
        path: "/audit-logs",
        component: AuditLogs,
    },
];

// Create a map of route paths for easier management
const routePaths = routes.map(route => route.path);

const AppRoutes = (props) => {
    const userPayload = getUserPayload();
    if (!userPayload) return <Redirect to="/login" />;

    return (
        <AppLayout>
            <Switch>
                {routes.map((route, index) => {
                    return (
                        <Route
                            key={index}
                            exact={route.exact}
                            path={route.path}
                            component={route.component}
                            render={route.render}
                        />
                    );
                })}
            </Switch>
        </AppLayout>
    );
};

const AppRouter = () => {
    return (
        // <AuthProvider>
            // <Router>
                <Switch>
                    {/* Wrap Login inside LoginContainer */}
                    <Route
                        path="/login"
                        render={(props) => (
                            <LoginContainer>
                                <Login />
                            </LoginContainer>
                        )}
                    />
                    
                    {/* Dynamically render all protected routes */}
                    {routePaths.map((path, index) => (
                        <Route key={index} path={path} component={AppRoutes} />
                    ))}

                    {/* Catch-all redirect */}
                    <Route path="/" exact component={() => <Redirect to="/home" />} />
                </Switch>
            // </Router>
        // </AuthProvider>
    );
};

export default AppRouter;
