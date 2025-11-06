import ApiService from "../../data/api";

export default class RegisterPage {
  async render() {
    return `
      <section class="container auth-page-container">
        <h1>Register Page</h1>
        <form id="register-form">
          <div id="error-message" style="color: red; margin-bottom: 10px; display: none;"></div>
          <div>
            <label for="name">Name</label>
            <input type="text" id="name" name="name" required>
          </div>
          <div>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div>
            <label for="password">Password (min. 8 karakter)</label>
            <input type="password" id="password" name="password" minlength="8" required>
          </div>
          <button type="submit" id="register-button">Register</button>
        </form>
      </section>
    `;
  }

  async afterRender() {
    const registerForm = document.querySelector("#register-form");
    const registerButton = document.querySelector("#register-button");
    const errorMessage = document.querySelector("#error-message");

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      registerButton.disabled = true;
      registerButton.textContent = "Registering...";
      errorMessage.style.display = "none";

      try {
        const name = event.target.name.value;
        const email = event.target.email.value;
        const password = event.target.password.value;

        await ApiService.register({ name, email, password });

        alert("Registrasi berhasil! Silakan login.");
        location.hash = "#/login";
      } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = "block";
      } finally {
        registerButton.disabled = false;
        registerButton.textContent = "Register";
      }
    });
  }
}
