import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppRouting } from './app.routing';
import { AppComponent } from './app.component';
import { ExternalRedirectComponent } from './external-redirect.component';
import { SellerPortalComponent } from './pages/seller-portal/seller-portal.component';
import { MarketplaceComponent } from './pages/marketplace/marketplace.component';

@NgModule({
  declarations: [
    AppComponent,
    ExternalRedirectComponent,
    // SellerPortalComponent and MarketplaceComponent are declared in DashboardModule
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    AppRouting
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
