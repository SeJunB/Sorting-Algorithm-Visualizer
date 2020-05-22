import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/** Class that is used to keeep track of the number of comparisons and array access.. */
@Injectable({
  providedIn: 'root',
})
export class CounterService {
  numberOfComparisons: number = 0;
  numberOfArrayAccess: number = 0;

  /* Subjects that are emitted during sorting by ArrayVisualizerComponent
  and subscribed in AppComponent. */
  updateComparisonCountSubj: Subject<number> = new Subject<number>();
  updateArrayAccessCountSubj: Subject<number> = new Subject<number>();

  /** Return the number of comparisons.
   * @returns number of comparisons.
   */
  getComparisonCount(): number {
    return this.numberOfComparisons;
  }

  /** Returns the number of array access.
   * @returns number of array access.
   */
  getArrayAccessCount(): number {
    return this.numberOfArrayAccess;
  }

  /** Increment {@code numberOfComparisons} by 1. */
  incrementComparisonCount(): void {
    this.numberOfComparisons++;
  }

  /** Increment {@code numberOfArrayAccess} by 1.*/
  incrementArrayAccessCount(): void {
    this.numberOfArrayAccess++;
  }

  /** Resets the number of comparisons and number of array access.
   * This method is called when the user clicks on a button or generates a new array.
   */
  reset(): void {
    this.numberOfComparisons = 0;
    this.numberOfArrayAccess = 0;
  }
}
