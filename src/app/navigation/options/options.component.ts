import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  QueryList,
  Renderer2,
  OnDestroy,
} from '@angular/core';
import { ArrayService } from 'src/app/shared/array.service';
import { CounterService } from 'src/app/shared/counter.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss'],
})
/** This class contains options for
 * the 4 sorting method.
 */
export class OptionsComponent implements OnInit, AfterViewInit, OnDestroy {
  options: string[] = [
    'Bubble Sort',
    'Merge Sort',
    'Counting Sort',
    'Quick Sort',
  ];
  activeOptionIndex;
  currentArraySize;
  @ViewChild('bubble') bubbleSortButton: ElementRef;
  @ViewChild('merge') mergeSortButton: ElementRef;
  @ViewChild('counting') countingSortButton: ElementRef;
  @ViewChild('quick') quickSortButton: ElementRef;

  buttonLocalRefs: ElementRef[] = [];
  validatedSubscription: Subscription;
  sliderChangeSubscription: Subscription;
  constructor(private arrayService: ArrayService, private render: Renderer2) {}

  ngOnInit(): void {
    this.validatedSubscription = this.arrayService.validatedSubj.subscribe(
      () => {
        for (let i = 0; i < this.buttonLocalRefs.length; i++) {
          if (i === this.activeOptionIndex) {
            this.render.removeClass(this.buttonLocalRefs[i], 'active');
          } else {
            this.render.removeAttribute(this.buttonLocalRefs[i], 'disabled');
          }
        }
        if (this.currentArraySize > 200) {
          this.render.setAttribute(
            this.bubbleSortButton.nativeElement,
            'disabled',
            'true'
          );
        }
      }
    );
    this.arrayService.sliderChangeSubj.subscribe((currentRangeValue) => {
      this.currentArraySize = currentRangeValue;
      if (currentRangeValue > 200) {
        this.render.setAttribute(
          this.bubbleSortButton.nativeElement,
          'disabled',
          'true'
        );
      } else {
        this.render.removeAttribute(
          this.bubbleSortButton.nativeElement,
          'disabled'
        );
      }
    });
  }

  ngOnDestroy() {
    this.validatedSubscription.unsubscribe();
    this.sliderChangeSubscription.unsubscribe();
  }

  ngAfterViewInit() {
    this.buttonLocalRefs = [
      this.bubbleSortButton.nativeElement,
      this.mergeSortButton.nativeElement,
      this.countingSortButton.nativeElement,
      this.quickSortButton.nativeElement,
    ];
  }

  /** Event handler when one of the four button is clicked.
   * On click, the index corresponding to the
   * selected button's text is passed in and it receives
   * the active class. All other buttons are disabled.
   * Additionally, the selected button's text is emitted
   * to ArrayVisualizer.
   * @param element the HTML element that was clicked.
   */
  onOptionClicked(index): void {
    this.activeOptionIndex = index;
    for (let i = 0; i < this.buttonLocalRefs.length; i++) {
      if (i === index) {
        this.render.addClass(this.buttonLocalRefs[i], 'active');
      } else {
        this.render.setAttribute(this.buttonLocalRefs[i], 'disabled', 'true');
      }
    }

    this.arrayService.optionClickedSubj.next(this.options[index]);
  }
}
