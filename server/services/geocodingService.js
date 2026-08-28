const locationService = require("./locationService");

const geocodingService = {
  async searchLocation(query) {
    if (!query) return [];
    return locationService.search(query);
  }
};

module.exports = geocodingService;
