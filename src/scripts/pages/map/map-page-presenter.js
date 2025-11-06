export default class MapPagePresenter {
  #view;
  #model;
  #stories = [];

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async init(targetStoryId = null) {
    try {
      this.#view.initializeMap(-2.5489, 118.0149, 5);

      this.#stories = await this.#model.getAllStoriesWithLocation();

      this.#view.showStoriesList(this.#stories);

      this.#stories.forEach((story) => {
        this.#view.addMarkerToMap(story);
      });
      
      // If targetStoryId is provided, focus on that story
      if (targetStoryId) {
        // Wait a bit for map and markers to be fully initialized
        setTimeout(() => {
          this.#view.focusOnStory(targetStoryId);
        }, 500);
      }
    } catch (error) {
      this.#view.showError(error.message);
    }
  }
}
