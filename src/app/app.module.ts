import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { NavigationComponent } from './navigation/navigation.component';
import { OptionsComponent } from './navigation/options/options.component';
import { ArrayVisualizerComponent } from './array-visualizer/array-visualizer';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    OptionsComponent,
    ArrayVisualizerComponent,
  ],
  imports: [BrowserModule, FormsModule, BrowserAnimationsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
