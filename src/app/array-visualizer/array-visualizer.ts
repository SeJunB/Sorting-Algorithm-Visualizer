import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ElementRef,
} from '@angular/core';
import * as d3 from 'd3';
import { ArrayService } from '../shared/array.service';
import { Subscription, Subject } from 'rxjs';
import { CounterService } from '../shared/counter.service';

@Component({
  selector: 'app-arrayvis',
  templateUrl: './array-visualizer.component.html',
  styleUrls: ['./array-visualizer.component.scss'],
})
/**
 * Each number in the array is represented by a div with a fixed width, a scaled height and
 * scaled color. The scaled height is obtained by mapping the min and max, referred to as extent in this class,
 * of the array to the height of the wrapper. This is achieved by using d3's scaleLinear.
 * Similarly, d3's Viridis interpolator was used to map the scaled height to a color on the Viridis color scheme.
 * For more information on d3's scale, reference @see {@link https://github.com/d3/d3-scale}.
 * For more information on the color scheme that was used, reference @see {@link https://github.com/d3/d3-scale-chromatic#interpolateViridis}.
 * Of note, the dimensions of each bin is first calculated and stored in an array, called {@code binDimensions}.
 * Then, it is rendered using the structural directive ngFor.
 * Credits:
 *  1. Inspriation for animating the sorting algorithms comes from Mike Bostock's quicksort visualization.
 *     @see {@link https://bl.ocks.org/mbostock/1582075}.
 *  2. The implementation of merge sort below is by Robert Sedgewick and Kevin Wayne.  Method was just re-written in Typescript.
 *     @see {@link https://algs4.cs.princeton.edu/22mergesort/Merge.java.html}.
 *
 */
export class ArrayVisualizerComponent
  implements OnInit, AfterViewInit, OnDestroy {
  //Container for the bins
  @ViewChild('wrapper') wrapper: ElementRef;
  wrapperDimension;

  generatedArray: number[] = [];
  generatedArrayUnsorted = [];
  binDimensions = [];
  fixedWidth: string;
  heightScale;
  colorScale;

  //When generate array button is clicked, emitted from AppComponent
  generateArrayClickedSub: Subscription;
  //When an option is clicked, emitted from OptionsComponent
  optionClickedSub: Subscription;
  //When the position of the thumb on the slider has changed, emitted from AppComponent
  sliderChangedSub: Subscription;

  animations = [];
  validationAnimations = [];
  test;

  //Auxiliary array used in merge sort.
  auxiliaryArray = [];

  constructor(private arrayService: ArrayService) {}

  /** Subcribe to Subjects. */
  ngOnInit(): void {
    //Receives value corresponding to the thumb's position on the slider. Value emitted when the user clicks on the generate array button.
    this.generateArrayClickedSub = this.arrayService.generateArraySubj.subscribe(
      (arraySize) => {
        this.setBinDimensions(arraySize);
      }
    );
    //Receives the option that was clicked. Emitted when the user clicks on an option.
    this.optionClickedSub = this.arrayService.optionClickedSubj.subscribe(
      (option) => {
        this.onOptionClicked(option);
      }
    );
    //Receives value corresponding to the thumb's position on the slider. Value emitted when the thumb's position has changed.
    this.sliderChangedSub = this.arrayService.sliderChangeSubj.subscribe(
      (arraySize) => {
        this.setBinDimensions(arraySize);
      }
    );
  }

  /** Unsubscribe to subscribed Subjects. */
  ngOnDestroy() {
    this.generateArrayClickedSub.unsubscribe();
    this.optionClickedSub.unsubscribe();
    this.sliderChangedSub.unsubscribe();
  }

  /** Calculates the wrapper's width and height. */
  calculateWrapperDimension() {
    const wrapper = this.wrapper.nativeElement.getBoundingClientRect();
    this.wrapperDimension = {
      width: wrapper.width,
      height: wrapper.height,
    };
  }

  /** Set dimensions for the the wrapper, generate array and calculate fixedWidth.
   */
  ngAfterViewInit(): void {
    /*Object containing width, height, etc of the wrapper.*/
    this.setBinDimensions();
  }

  /** Generates array, calculates the appropriate fixed width and sets the bin dimensions.
   * @param size size of the array to generate. Defaults to 150.
   */
  setBinDimensions(size = 150) {
    //Recalculate wrapper size in case window size has changed.
    this.calculateWrapperDimension();
    //Reset to handle cases when there is an existing array.
    this.generatedArray.length = 0;
    this.arrayService.clearArray();
    this.generatedArray = this.arrayService.generateArray(size);
    /* this.generatedArray = [350, 200, 300, 150, 250, 225, 200]; */

    this.fixedWidth = `${
      Math.floor(this.wrapperDimension.width / this.generatedArray.length) + 3
    }px`; //3px for padding
    this.createScales();
    this.calculateBinDimensions(this.generatedArray);
  }

  /** Create the scales used in calculating the dimensions of the bins. */
  createScales(): void {
    //Min and max of array
    const extent = d3.extent(this.generatedArray);
    //Returns a function that maps numbers in the array to the wrapper's height.
    this.heightScale = d3
      .scaleLinear()
      .domain(extent)
      .range([0, this.wrapperDimension.height])
      .nice();
    let extentScaled = [];
    extent.forEach((element) => {
      extentScaled.push(this.heightScale(element));
    });
    //Returns a function that maps scaled height to a color in the Viridis color scheme
    this.colorScale = d3
      .scaleSequential()
      .domain(extentScaled)
      .interpolator(d3.interpolateViridis);
  }

  /** For each number in the array, this method calculates the dimension for a bin in respect to that number
   * and pushes it onto the array, {@code binDimensions}.
   * @param array array of interest
   */
  calculateBinDimensions(array) {
    this.binDimensions.length = 0;
    for (let i = 0; i < this.generatedArray.length; i++) {
      const element = this.generatedArray[i];
      const heightScaled = this.heightScale(element);
      const scaledColor = this.colorScale(heightScaled);
      this.binDimensions[i] = {
        value: element,
        width: `${this.fixedWidth + 2}px`,
        height: `${heightScaled}px`,
        color: `${scaledColor}`,
      };
    }
  }

  /** Sets the dimension for an existing bin at {@code i} in respect to {@code value}.
   * @param i index of bin to be changed.
   * @param value the value used to calculate the bin's dimension.
   */
  calculateBinDimension(i: number, value: number) {
    const heightScaled = this.heightScale(value);
    const color = this.colorScale(heightScaled);
    this.binDimensions[i].value = value;
    this.binDimensions[i].height = `${heightScaled}px`;
    this.binDimensions[i].color = `${color}`;
  }

  /** Executes the sorting method and animation matching {@code option}.
   * @param option sorting method to be executed.
   */
  onOptionClicked(option) {
    this.animations.length = 0;
    //Copy of main array before it is sorted.
    this.generatedArrayUnsorted = this.arrayService.getArray();
    this.validationAnimations.length = 0;
    this.auxiliaryArray.length = 0;

    switch (option) {
      case 'Bubble Sort':
        this.bubbleSort(this.generatedArray);
        this.animations.reverse();
        this.bubbleSortAnimation();
        break;
      case 'Merge Sort':
        this.mergeSort(
          this.generatedArray,
          this.auxiliaryArray,
          0,
          this.generatedArray.length - 1
        );

        this.animations.reverse();
        this.animateMergeSort();
        break;
      case 'Counting Sort':
        this.countingSort(this.generatedArray);
        this.animations.reverse();
        this.animateCountingSort();
        break;
      case 'Quick Sort':
        this.quickSort(this.generatedArray, 0, this.generatedArray.length - 1);
        this.animations.reverse();
        this.animateQuickSort();
        break;
    }
  }

  /** Sorts the array by repeatedly calling {@code bubble} with a {@code lo} of 0 and {@code hi} of {@code i}, index of the current iteration, until {@code i == 0}.
   * @param array an unsorted array.
   */
  bubbleSort(array) {
    for (let i = array.length - 1; i > 0; i--) {
      this.bubble(array, 0, i);
    }
  }

  /** Iterates through {@code array} from {@code lo} to {@code hi - 1} and swaps adjacent elements that are not in order.
   * For each swap, an object containing the indicies of the elements that are swapped are pushed on to the {@code animations} array.
   * This method guarantees that the largest element in the range {@code lo} to {@code hi} will be at index {@code hi}.
   * @param array array to be sorted
   * @param lo lower index
   * @param hi upper index
   */
  bubble(array, lo, hi) {
    for (let i = lo; i < hi; i++) {
      if (array[i] > array[i + 1]) {
        this.animations.push({
          lo: i,
          hi: i + 1,
        });
        this.swap(array, i, i + 1);
      }
    }
  }

  /** Swaps elements at {@code index1} and {@code index2}.
   * @param array array with the elements to swap.
   * @param index1 index of the first element
   * @param index2 index of the second element
   */
  swap(array, index1, index2) {
    const temporary = array[index1];
    array[index1] = array[index2];
    array[index2] = temporary;
  }

  /** Repeatedly swaps the bin dimensions for indicies defined in each element of the {@code animation} array until the {@code animation} array is empty
   * at which point setInterval is cleared.
   */
  bubbleSortAnimation() {
    const animations = setInterval(() => {
      let action = this.animations.pop();
      //If action is defined
      if (action) {
        const temporary = this.binDimensions[action.lo];
        this.binDimensions[action.lo] = this.binDimensions[action.hi];
        this.binDimensions[action.hi] = temporary;
      } else {
        //Executed when the animation array is empty.
        clearInterval(animations);
        this.validate();
      }
    }, 5);
  }

  /**
   * An array with only one element is sorted. This method recursively
   * divides the array into two subarrays eventually resulting in values of hi and lo for every element in the array
   * such that {@code hi <= lo}, indicating that there is only one element.
   * From there, those sorted subarrays are merged by the merge method, resulting in a sorted array.
   * Repeating this for every element in the array guarantees that the element of {@code a} from range {@code lo} to {@code hi} will be sorted.
   * @param a array to be sorted
   * @param aux auxilirary array storing each subarray
   * @param lo  lower index
   * @param hi  higher index
   */
  mergeSort(a, aux, lo, hi) {
    if (hi <= lo) {
      return;
    }
    let mid = Math.floor(lo + (hi - lo) / 2);
    this.mergeSort(a, aux, lo, mid);
    this.mergeSort(a, aux, mid + 1, hi);
    this.merge(a, aux, lo, mid, hi);
  }

  /** Given an array {@code a} and an auxiliary array {@code aux}, sorts in place
   * elements of {@code a} in the range from {@code lo} to {@code hi}. A precondition for this method is that
   * the subarrary from {@code lo} to {@code mid} and the subarray from {@code mid + 1} to {@code hi} are sorted.
   * @param a array to be sorted
   * @param aux auxiliary array to copy {@code a}.
   * @param lo lower index
   * @param hi upper index
   * Implementation by Robert Sedgewick and Kevin Wayne.  */
  merge(a, aux, lo, mid, hi) {
    //Copy
    for (let i = lo; i <= hi; i++) {
      aux[i] = a[i];
    }
    /* Conceptually, divides the auxiliary array into two sorted subarrays with one containing elements from lo to mid
     * and the other containing elements from mid + 1 to hi.
     * Then, if the subarrays have not been exhausted,
     * we compare elements in the two subarrays for those iteration indices until one of the subarrays are exhausted. The smaller element replaces the element in the main array
     * at that iteration index and the index of the subarray containing that element is increased.
     * Repeating this pattern, one array will be exhausted at which point the elements of the other subarray can
     * replace the remaining elements of the main array. This results in the element of the main array from lo to hi, inclusive, sorted.
     */
    let i = lo,
      j = mid + 1;
    for (let k = lo; k <= hi; k++) {
      //Case when one subarray has been exhausted.
      if (i > mid) {
        //Record the index of the main array and the replaced value.
        this.animations.push({ index: k, value: aux[j] });
        a[k] = aux[j++];
      } else if (j > hi) {
        this.animations.push({ index: k, value: aux[i] });
        a[k] = aux[i++];
      } else if (aux[i] > aux[j]) {
        //Smaller element replacing element in the main array
        this.animations.push({ index: k, value: aux[j] });
        a[k] = aux[j++];
      } else {
        this.animations.push({ index: k, value: aux[i] });
        a[k] = aux[i++];
      }
    }
  }

  /**Repeatedly replaces the bin dimensions at indicies and values defined in each element of the {@code animation} array until the {@code animation} array is empty
   * at which point setInterval is cleared and {@code validate()} is called to validate the array.*/
  animateMergeSort() {
    let animation = setInterval(() => {
      const action = this.animations.pop();
      if (action) {
        this.calculateBinDimension(action.index, action.value);
      } else {
        clearInterval(animation);
        this.validate();
      }
    }, 5);
  }

  /** Method that invokes the method that validate the array. */
  validate() {
    this.validateArray();
    this.validationAnimations.reverse();
    this.animateValidation();
  }
  /** Validates the sorted array by invoking .sort() on
   * {@code generatedArrayUnsorted}, which is a
   * copy of {@code generatedArray} prior to sorting,  and comparing the value of binDimension with that of the
   * sorted array for 0 to array.length - 1. */
  validateArray() {
    const sorted = this.generatedArrayUnsorted.sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
      if (this.binDimensions[i].value === sorted[i]) {
        //A Bin with index sufficing the above condition is in its sorted position.
        this.validationAnimations.push({
          index: i,
          originalColor: this.binDimensions[i].color,
        });
      } else {
        break;
      }
    }
  }

  /** Repeatedly switches the color of each bin to green and back to its original color for indices defined
   *  in the {@code validationArray}  until the array is undefined, at which point the interval is cleared
   *  and {@code validate()} is called to validate the array.
   *  All such bins at those indices are guaranteed to be in its sorted position in the array.
   */
  animateValidation() {
    const animation = setInterval(() => {
      const action = this.validationAnimations.pop();
      if (action) {
        const index = action.index;
        const originalColor = action.originalColor;
        this.binDimensions[index].color = 'green';
        setTimeout(() => {
          this.binDimensions[index].color = originalColor;
        }, 10);
      } else {
        clearInterval(animation);
        this.arrayService.validatedSubj.next();
      }
    }, 10);
  }

  /** Chooses the first element of the list as the pivot.
   * At the end of this method, the pivot is placed in the array
   * such that all elements with a lower index are less than or equal
   * to the pivot and all elements with a higher index are greater than or
   * equal to the pivot.
   * @param array array of interest
   * @param lo lower index
   * @param hi higher index.
   */
  partition(array, lo, hi) {
    const pivot = array[lo];
    let start = lo;
    let end = hi;
    while (true) {
      /*Has to be less than or equal to as array[start]
      and pivot are equal at the first iteration. */
      while (array[start] <= pivot) {
        /** Break out of loop when start >= hi.
         * Without it, values would be undefined for cases
         * in which elements to the right of the pivot are
         * less than the pivot as start would increase until
         * array[start] is undefined.
         */
        if (start >= hi) {
          break;
        }
        start++;
      }
      /*
       * Cannot be >= as end would become negative
       * when all the elements to the right of the pivot are
       * greater than the pivot and vlaues with those indicies
       * would be indices.
       */
      while (array[end] > pivot) {
        end--;
      }
      /** Has to be greater than or equal to handle cases
       * when all the elements to the right of the pivot are less
       * than the pivot. For example, [2, 0, 1], in this example
       * start would be 2 and end would also be, leading to an infinite loop
       * without the greater than or equal to inequality.
       */
      if (start >= end) {
        break;
      }
      this.swap(array, start, end);
      this.animations.push({
        name: 'swap-element',
        index1: start,
        index2: end,
      });
    }
    this.swap(array, lo, end);
    this.animations.push({
      name: 'swap-pivot',
      pivotIndex: lo,
      swapIndex: end,
    });
    return end;
  }

  /** Repeatedely swaps the binDimensions defined in each element of the {@code animations} array until the {@code action} is undefined at which the interval is cleared and
   * {@code validate()} is called to validate the array.
   */
  animateQuickSort() {
    const animations = setInterval(() => {
      const action = this.animations.pop();
      if (action) {
        switch (action.name) {
          case 'swap-element':
            const index1 = action.index1;
            const index2 = action.index2;
            const temporary = this.binDimensions[index1];
            this.binDimensions[index1] = this.binDimensions[index2];
            this.binDimensions[index2] = temporary;
            break;
          case 'swap-pivot':
            const pivotIndex = action.pivotIndex;
            const swapIndex = action.swapIndex;
            const temp = this.binDimensions[pivotIndex];
            this.binDimensions[pivotIndex] = this.binDimensions[swapIndex];
            this.binDimensions[swapIndex] = temp;
            break;
        }
      } else {
        clearInterval(animations);
        this.validate();
      }
    }, 5);
  }

  /** Split the array between the initial pivot obtained
   * and continue to partition those subarrays until
   * {@code lo >= hi} only a single element is left in the subarray.
   * By how the pivots are placed by the partition method,
   * those subarrays are guaranteed to be sorted, eventually
   * sorting the array in place.
   * @param array array of interest
   * @param lo lower index
   * @param hi higher index.
   */
  quickSort(array, lo, hi) {
    if (lo >= hi) {
      return;
    }
    let partitionLocation = this.partition(array, lo, hi);
    this.quickSort(array, lo, partitionLocation - 1);
    this.quickSort(array, partitionLocation + 1, hi);
  }

  /**
   * Counting Sort is an algorithm in which the sorted position of each element
   * is calculated by applying arithmetics on an object, an array in my case, containing
   * the distinct integers of {@code array} as keys and how many times that integer
   * is repeated in the array as values. Counting Sort is applicable to any
   * arrays generated by the arrayService as the range of integers in that array
   * is from [0, 300].
   * @param array array to be sorted.
   */
  countingSort(array) {
    const max = Math.max(...array);

    //Object as described above.
    let count = [];
    for (let i = 0; i < max + 1; i++) {
      count[i] = 0;
    }

    /** Calculate how many times the key is repeated in the array. */
    for (let i = 0; i < array.length; i++) {
      const key = array[i];
      count[key]++;
    }

    /** Calculate sorted position.*/
    for (let i = 0; i < count.length - 1; i++) {
      const delta = count[i];
      count[i + 1] += delta;
    }

    let aux = [];
    for (let i = 0; i < array.length; i++) {
      aux[i] = 0;
    }

    //Insert the element in its sorted position.
    for (let i = array.length - 1; i >= 0; i--) {
      const key = array[i];
      const sortedPosition = --count[key];
      aux[sortedPosition] = key;
      this.animations.push({ index: sortedPosition, newValue: key });
    }

    //Copy the sorted array to the original array
    for (let i = 0; i < aux.length; i++) {
      array[i] = aux[i];
    }
  }

  /** Animates the insertion of element into its sorted position as defined
   * in each element of the {@code animations} array. This is continued
   * until the {@code animations} array been exhausted at which
   * setInterval is cleared and {@code validate()} is called.
   */
  animateCountingSort() {
    const animations = setInterval(() => {
      const action = this.animations.pop();
      if (action) {
        this.calculateBinDimension(action.index, action.newValue);
      } else {
        clearInterval(animations);
        this.validate();
      }
    }, 5);
  }
}
