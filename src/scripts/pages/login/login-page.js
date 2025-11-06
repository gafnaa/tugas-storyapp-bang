import ApiService from "../../data/api";

export default class LoginPage {
  async render() {
    return `
      <section class="container auth-page-container">
        <h1>Login Page</h1>
        <form id="login-form">
          <div id="error-message" style="color: red; margin-bottom: 10px; display: none;"></div>
          <div>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          <button type="submit" id="login-button">Login</button>
        </form>
      </section>
    `;
  }

  async afterRender() {
    const loginForm = document.querySelector("#login-form");
    const loginButton = document.querySelector("#login-button");
    const errorMessage = document.querySelector("#error-message");

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      loginButton.disabled = true;
      loginButton.textContent = "Logging in...";
      errorMessage.style.display = "none";

      try {
        const email = event.target.email.value;
        const password = event.target.password.value;
        const response = await ApiService.login({ email, password });

        sessionStorage.setItem("token", response.loginResult.token);

        location.hash = "#/map";
      } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = "block";
      } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
      }
    });
  }
}
