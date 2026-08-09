import MarksService from '../services/MarksService';

class MarksController {
  private marksService: MarksService;

  constructor(marksService: MarksService) {
    this.marksService = marksService;
  }

  // Controller implementation
}

export default MarksController;