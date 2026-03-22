import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRouting } from './app.routing';
import { AppComponent } from './app.component';
import { ExternalRedirectComponent } from './external-redirect.component';

@NgModule({
  declarations: [
    AppComponent,
    ExternalRedirectComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRouting
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
