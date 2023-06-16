import { SupportService } from '../core/support.service';
import { AuthService } from './../auth/auth.service';
import { Component, OnInit } from '@angular/core';
import {UserService } from '../core/user.service';
import { Router } from '@angular/router';
import { ConfigService } from '../core/config.service';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss']
})
export class SupportComponent implements OnInit {

  title = {
    title: 'Support',
    icon: 'question'
  };
  ip: string;
  userAgent = navigator.userAgent;
    currentUser;
    description;
    lastActivity;
  constructor(
    private userServ: UserService,
    private authService: AuthService,
    private supportServ: SupportService,
    private router: Router,
    public configService: ConfigService
  ) { }

  ngOnInit() {
    console.log('support component intitialized ', this.configService.config.branding);
    this.getUserIp();
    this.currentUser = this.authService.currentUserValue;
  }


  getUserIp() {
    this.userServ.getUserIp().subscribe(res => {
      this.ip = res.ip;
    });
  }

  sendSupportRequest() {

    console.log('send request ', this.lastActivity, this.description, this.userAgent, this.ip, this.currentUser.email);
    this.supportServ.sendSupportRequest({
      description: this.description,
      lastActivity: this.lastActivity,
      userAgent: this.userAgent
    }).subscribe(res => {
      console.log('support res ', res);
      this.router.navigate([''], { state: {confirmed: true}});
    });
  }

}
