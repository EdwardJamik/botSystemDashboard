import { Route, Routes } from 'react-router-dom';
import Home from "./pages/Home.jsx";
import SignIn from "./pages/SignIn.jsx";
import Main from "./components/layout/Main.jsx";
import "antd/dist/reset.css";
import "./assets/styles/main.css";
import "./assets/styles/responsive.css";
import {Suspense} from "react";
import {ProtectedRoute} from "./ProtectedRoute.jsx";

import Sending from "./pages/Sending/Sending.jsx";
import BotPage from "./pages/BotPage/BotPage.jsx";
import GroupPage from "./pages/GroupPage/GroupPage.jsx";
import HashTagsPage from "./pages/HashTagUsers/HashTagsPage.jsx";

function App() {
    const routes = [
        {
            link: '/sign-in',
            element: <ProtectedRoute element={<SignIn/>}/>,
        },
        {
            link: '/',
            element:<ProtectedRoute element={<Main><Home/></Main>}/>,
        },
        {
            link: '/bot/:id',
            element: <ProtectedRoute element={<Main><BotPage/></Main>}/>,
        },
        {
            link: '/bot/:id/:chat_id',
            element: <ProtectedRoute element={<Main><GroupPage/></Main>}/>,
        },
        {
            link: '/bot/:id/:chat_id/:hash_id',
            element: <ProtectedRoute element={<Main><HashTagsPage/></Main>}/>,
        },
        {
            link: '/bot/:id/:chat_id/:hash_id/:type',
            element: <ProtectedRoute element={<Main><HashTagsPage/></Main>}/>,
        },
        {
            link: '/bot/:id/mailing',
            element: <ProtectedRoute element={<Main><Sending/></Main>}/>,
        },
        {
            link: '*',
            element: <ProtectedRoute element={<Main><Home/></Main>}/>,
        }
    ];
    return (
        <div className="App">
            <Routes>
                {routes.map(route => (
                    <Route
                        key={route.link}
                        path={route.link}
                        element={
                            <Suspense>
                                {route.element}
                            </Suspense>
                        }
                    />
                ))}
            </Routes>
        </div>
    );
}

export default App;