import HomePage from "../pages/home/home-page";
import AboutPage from "../pages/about/about-page";
import LoginPage from "../pages/login/login-page";
import RegisterPage from "../pages/register/register-page";
import MapPage from "../pages/map/map-page";
import AddStoryPage from "../pages/add-story/add-story-page";
import StoryDetailPage from "../pages/story-detail/story-detail-page";

const routes = {
  "/": new HomePage(),
  "/map": new MapPage(),
  "/add": new AddStoryPage(),
  "/about": new AboutPage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
  "/story/:id": new StoryDetailPage(),
};

export default routes;
