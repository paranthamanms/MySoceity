import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit {
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Retrieve token and user data from URL query parameters if coming from login redirect
    this.route.queryParams.subscribe(params => {
      if (params['token'] && !localStorage.getItem('token')) {
        localStorage.setItem('token', params['token']);
      }
      if (params['user'] && !localStorage.getItem('user')) {
        localStorage.setItem('user', params['user']);
      }
    });
  }
}
