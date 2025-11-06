import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import { isLoggedIn, logout } from "../utils/auth";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
    this.#setupLogoutButton();
    this.#setupSkipLink();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  #setupLogoutButton() {
    const logoutLink = document.querySelector("#nav-logout-link");
    logoutLink.addEventListener("click", (event) => {
      event.preventDefault();
      logout();
      this.#updateNavbar();
      this.#navigationDrawer.classList.remove("open");
    });
  }

  #setupSkipLink() {
    const skipLink = document.querySelector(".skip-to-content");
    const mainContent = document.querySelector("#main-content");

    skipLink.addEventListener("click", (event) => {
      event.preventDefault();

      mainContent.setAttribute("tabindex", -1);
      mainContent.focus();

      mainContent.addEventListener(
        "blur",
        () => {
          mainContent.removeAttribute("tabindex");
        },
        { once: true }
      );
    });
  }

  #updateNavbar() {
    const loggedIn = isLoggedIn();

    const navBeranda = document.querySelector("#nav-beranda");
    const navPeta = document.querySelector("#nav-peta");
    const navTambah = document.querySelector("#nav-tambah");
    const navLogout = document.querySelector("#nav-logout");
    const navLogin = document.querySelector("#nav-login");
    const navRegister = document.querySelector("#nav-register");
    const navAbout = document.querySelector("#nav-about");

    if (loggedIn) {
      navBeranda.style.display = "list-item";
      navPeta.style.display = "list-item";
      navTambah.style.display = "list-item";
      navLogout.style.display = "list-item";
      navLogin.style.display = "none";
      navRegister.style.display = "none";
      navAbout.style.display = "none";
    } else {
      navLogin.style.display = "list-item";
      navRegister.style.display = "list-item";
      navBeranda.style.display = "none";
      navPeta.style.display = "none";
      navTambah.style.display = "none";
      navLogout.style.display = "none";
      navAbout.style.display = "none";
    }
  }

  async renderPage() {
    this.#updateNavbar();

    const url = getActiveRoute();
    const loggedIn = isLoggedIn();
    const protectedRoutes = ["/", "/map", "/add", "/about", "/story/:id"];
    const publicRoutes = ["/login", "/register"];
    const isProtectedRoute = protectedRoutes.includes(url) || url.startsWith("/story/");
    const isPublicRoute = publicRoutes.includes(url);

    if (!loggedIn && isProtectedRoute) {
      location.hash = "#/login";
      return;
    }
    if (loggedIn && isPublicRoute) {
      location.hash = "#/";
      return;
    }

    document.querySelector("header").style.display = "block";

    let page;
    if (routes[url]) {
      page = routes[url];
    } else if (url.startsWith("/story/")) {
      
      page = routes["/story/:id"];
    } else {
      page = loggedIn ? routes["/"] : routes["/login"];
      location.hash = loggedIn ? "#/" : "#/login";
    }

    if (!document.startViewTransition) {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
      return;
    }

    const transition = document.startViewTransition(() => {
      const updateDom = async () => {
        this.#content.innerHTML = await page.render();
        await page.afterRender();
      };
      return updateDom();
    });

    try {
      await transition.finished;
    } catch (e) {
      console.error("View transition failed:", e);
    }
  }
}

export default App;
