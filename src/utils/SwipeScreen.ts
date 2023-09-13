import Hammer from 'hammerjs';

class SwipeHandler {
  private hammer: HammerManager;
  private nextQuestion: () => void;
  private preQuestion: () => void;

  constructor(element: HTMLElement, nextQuestion: () => void, preQuestion: () => void) {
    this.hammer = new Hammer(element);
    this.nextQuestion = nextQuestion;
    this.preQuestion = preQuestion;

    this.hammer.on('swipeleft', this.handleSwipeLeft);
    this.hammer.on('swiperight', this.handleSwipeRight);
  }

  private handleSwipeLeft = () => {
    this.nextQuestion();
  }

  private handleSwipeRight = () => {
    this.preQuestion();
  }
}

export default SwipeHandler;