import { CallService } from './../call.service';
import { Subscription, Subject } from 'rxjs';
import { OpenViduService } from './../openvidu.service';
import { Component, OnInit, Input, NgZone, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ConsultationService } from '../consultation.service';
import { Router, ActivatedRoute } from '@angular/router';
import { SocketEventsService } from '../socket-events.service';
import { ConfirmationService } from '../confirmation.service';
import { InviteService } from '../invite.service';


@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.component.html',
  styleUrls: ['./consultation.component.scss']
})
export class ConsultationComponent implements OnInit, OnDestroy {



  @Input() consultation;
  public publicinvite;
  consultationId;
  token;
  incomingCall = false;
  user;
  callEvent;
  confirmClose = false;
  showFeedback = false;
  redirect;
  audioOnly = false;


  volumeLevel: number = 0;
  showConfiguration: boolean = false;

  videoDeviceId: string;
  audioDeviceId: string;
  videoDevices = [];
  audioDevices = [];

  currentCall;

  subscriptions: Subscription[] = [];

  constructor(
    private conServ: ConsultationService,
    private inviteServ: InviteService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private _socketEventsService: SocketEventsService,
    private zone: NgZone,
    private confirmationServ: ConfirmationService,
    private openViduService: OpenViduService,
    private callService: CallService
  ) {

    this.callEvent = {};
    if (this.router.getCurrentNavigation() && this.router.getCurrentNavigation().extras.state) {
      this.callEvent = this.router.getCurrentNavigation().extras.state;
    }

  }

  ngOnInit() {
    this.consultationId = this.activeRoute.snapshot.params.id;
    this.getConsultation();
    this.callEvent.id = this.callEvent._id = this.consultationId;
    if (this.callEvent.token) {
      this.incomingCall = true;
    }



    this.subscriptions.push(this._socketEventsService.onEndCall().subscribe(e => {
      console.log('end call event ', e)
      if (this.currentCall && this.currentCall.id === e.data.message.id) {
        this.currentCall = null
        this.token = null;
        this.incomingCall = null
      }
    }))
    this.subscriptions.push(this.confirmationServ.getConfirmation().subscribe(redirect => {
      this.redirect = redirect;
      this.confirmClose = true;
    }));

    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then((stream) => {
        stream.getTracks().forEach(track => track.stop());
        this.openViduService.getDevices().then(devices => {
          console.log('devices ', devices);
          this.videoDevices = devices.filter(device => device.kind === 'videoinput');
          if (this.videoDevices.length && this.videoDevices[0].deviceId !== '') {
            this.videoDeviceId = this.videoDevices[0].deviceId;
          }
          this.audioDevices = devices.filter(device => device.kind === 'audioinput');
          if (this.audioDevices.length && this.audioDevices[0].deviceId !== '') {
            this.audioDeviceId = this.audioDevices[0].deviceId;
          }
        });
      })
      .catch((error) => {
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
          stream.getTracks().forEach(track => track.stop());
          this.openViduService.getDevices().then(devices => {
            this.videoDevices = devices.filter(device => device.kind === 'videoinput');
            if (this.videoDevices.length && this.videoDevices[0].deviceId !== '') {
              this.videoDeviceId = this.videoDevices[0].deviceId;
            }
          });
        }).catch(() => { });
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          stream.getTracks().forEach(track => track.stop());
          this.openViduService.getDevices().then(devices => {
            this.audioDevices = devices.filter(device => device.kind === 'audioinput');
            if (this.audioDevices.length && this.audioDevices[0].deviceId !== '') {
              this.audioDeviceId = this.audioDevices[0].deviceId;
            }
          });
        }).catch(() => { });
      });
  }

  getConsultation() {
    this.subscriptions.push(this.conServ.getConsultation(this.consultationId).subscribe(consultation => {
      console.log('got consultation ', consultation);

      if (!this.consultation) {

        this.subscriptions.push(this.inviteServ.getByConsultation(this.consultationId).subscribe(publicinvite => {
          console.log('got public invite ', publicinvite);
          this.publicinvite = publicinvite;
        }));

      }

      this.consultation = consultation;
    }));
  }


  makeCall(audioOnly) {

    this.audioOnly = audioOnly;
    console.log('make call ', this.consultation, this.currentCall);
    this.openViduService.getToken(this.consultationId, audioOnly).then((response) => {

      console.log('got token ', response)
      this.token = response.token
      this.incomingCall = true;
      this.currentCall = response.msg;

    })
  }
  reject() {

    this.zone.run(() => {
      this.incomingCall = false;
    });
    if (this.currentCall) {
      this.openViduService.rejectCall(this.consultationId, this.currentCall.id).then(r => {
        this.currentCall = null;
        console.log('call rejected DUDE!!!!')
      }).catch(err => {
        console.log('error ', err);
      });
    }
    this.callEvent.token = undefined;

  }

  openConfiguration() {


    this.showConfiguration = true;
  }

  closeConfiguration() {



    this.showConfiguration = false;
  }




  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
