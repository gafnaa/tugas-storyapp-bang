export default class HomePagePresenter {
  #view;
  #model;
  #currentPage = 1;
  #pageSize = 10;
  #hasMore = true;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async init() {
    try {
      this.#currentPage = 1;
      const stories = await this.#model.getAllStories(this.#currentPage, this.#pageSize);
      this.#hasMore = stories.length === this.#pageSize;
      this.#view.showItems(stories);
      this.#view.updateLoadMoreButton(this.#hasMore);
    } catch (error) {
      this.#view.showError(error.message);
    }
  }

  async loadMore() {
    if (!this.#hasMore) return;

    try {
      this.#currentPage++;
      const stories = await this.#model.getAllStories(this.#currentPage, this.#pageSize);
      this.#hasMore = stories.length === this.#pageSize;
      this.#view.appendItems(stories);
      this.#view.updateLoadMoreButton(this.#hasMore);
    } catch (error) {
      console.error("Error loading more stories:", error);
      this.#view.showError("Gagal memuat cerita tambahan");
    }
  }
}
