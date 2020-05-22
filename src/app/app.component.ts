import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { ArrayService } from './shared/array.service';
import { CounterService } from './shared/counter.service';
import { Subscription } from 'rxjs';
import * as d3 from 'd3';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
/** This class keeps track of the number of array access as well as the number of comparisons
 * produces the color for the linear gradient.
 * Additionally, emits events to ArrayVisualizerComponent whenever
 * the current size of the array (controlled by the slider) or the generate array button is clicked.
 */
export class AppComponent implements OnInit, OnDestroy {
  title = 'Sorting Algorithm Visualizer';

  optionClicked = false;

  arrayAccessCount: number = 0;
  comparisonCount: number = 0;

  comparisonCountSub: Subscription;
  arrayAccessCountSub: Subscription;
  optionClickedSub: Subscription;
  validatedSub: Subscription;

  //Corresponds to the position of the thumb in the slider.
  currentArraySize: number = 150;
  linearGradientStyle: string;

  constructor(
    private arrayService: ArrayService,
    private counterService: CounterService,
    private render: Renderer2
  ) {}

  /** Subscribe to subjects to set arrayAccessCount and comparisonCount whenever it is updated in ArrayVisualizerComponent as
   * well as react to when an option is clicked in the OptionsComponent.
   */
  ngOnInit(): void {
    this.arrayAccessCountSub = this.counterService.updateArrayAccessCountSubj.subscribe(
      (newCount: number) => {
        this.arrayAccessCount = newCount;
      }
    );
    this.comparisonCountSub = this.counterService.updateComparisonCountSubj.subscribe(
      (newCount: number) => {
        this.comparisonCount = this.comparisonCount;
      }
    );
    this.optionClickedSub = this.arrayService.optionClickedSubj.subscribe(
      (innerText) => {
        this.counterService.reset();
        this.comparisonCount = 0;
        this.arrayAccessCount = 0;
        this.optionClicked = true;
      }
    );
    this.validatedSub = this.arrayService.validatedSubj.subscribe(() => {
      this.optionClicked = false;
    });
    this.createLinearGradient();
  }

  /** Produces the colors by using d3's interpolateViridis method.
   * These are concatenated and assigned to {@code linearGradientStyle}, which
   * is property bound to the legend's style attribute.
   */
  createLinearGradient() {
    const numberOfGradientStops = 10;
    const stops = d3
      .range(numberOfGradientStops)
      .map((i) => i / (numberOfGradientStops - 1));
    let colors = [];
    for (let i = 0; i < stops.length; i++) {
      colors.push(d3.interpolateViridis(stops[i])); //Each element is a hexcode representing a color in the Viridis color scheme.
    }
    this.linearGradientStyle =
      `linear-gradient` + `(45deg, ${colors.join(',')})`;
  }

  /** Unsubscribe to subjects. This is necessary failint to unsubscribe could lead to memory leaks. */
  ngOnDestroy(): void {
    this.arrayAccessCountSub.unsubscribe();
    this.comparisonCountSub.unsubscribe();
    this.optionClickedSub.unsubscribe();
    this.validatedSub.unsubscribe();
  }

  /**
   * Invoked when the thumb on the slider is moved by the user.
   * Updates currentArraySize in this class and sliderAlert emits a value;
   * that subject is subscribed in ArrayVisualizerComponent, which invokes
   * {@code setBinDimensions(currentValue)}
   * @param currentValue value corresponding to the position of the thumb in the slider.
   */
  onRangeChange(currentValue): void {
    this.currentArraySize = currentValue;
    this.arrayService.sliderChangeSubj.next(currentValue);
  }

  /**
   * Invoked when the user presses the 'Generate Array' button.
   * GenerateArrayAlert emits void; that subject is subscribed in ArrayVisualizerComponent
   * which generates a new array and invokes {@code setBinDimensions()}.
   */
  onGenerateArray(): void {
    this.arrayService.generateArraySubj.next(this.currentArraySize);
  }
}
