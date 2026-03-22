import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-external-redirect',
  template: `
    <div class="redirect-page">
      Redirecting...
    </div>
  `,
  styles: [
    `
      .redirect-page {
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, Helvetica, sans-serif;
        color: #333;
      }
    `
  ]
})
export class ExternalRedirectComponent implements OnInit {
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const externalUrl = this.route.snapshot.data['externalUrl'] as string | undefined;
    if (externalUrl) {
      window.location.href = externalUrl;
    }
  }
}
