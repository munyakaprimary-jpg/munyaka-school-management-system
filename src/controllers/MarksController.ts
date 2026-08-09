import marksServiceInstance from '../services/MarksService';

class MarksController {
  private marksService: MarksService;

  constructor() {
    this.marksService = marksServiceInstance;
  }

  // Controller methods
}

export default new MarksController(); // Singleton pattern for easy access