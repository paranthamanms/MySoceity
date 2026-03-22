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
    let externalUrl = this.route.snapshot.data['externalUrl'] as string | undefined;
    if (externalUrl) {
      // Pass auth token and user data in URL for dashboard access
      if (externalUrl.includes('4203') || externalUrl.includes('dashboard')) {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token) {
          const separator = externalUrl.includes('?') ? '&' : '?';
          externalUrl = `${externalUrl}${separator}token=${encodeURIComponent(token)}`;
          if (user) {
            externalUrl = `${externalUrl}&user=${encodeURIComponent(user)}`;
          }
        }
      }
      window.location.href = externalUrl;
    }
  }
}
