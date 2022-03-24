import { AuthService } from "./../auth/auth.service";
import {
  RoomService,
  LogService,
  RemotePeersService,
  Stream,
} from "hug-angular-lib";
import { CallService } from "./../call.service";
import {
  OpenViduLayout,
  OpenViduLayoutOptions,
} from "./layout/openvidu-layout";
import { Subscription } from "rxjs";
import { ConsultationService } from "./../consultation.service";

import { environment } from "./../../environments/environment";
import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  QueryList,
  ViewChildren,
  EventEmitter,
  Output,
  Input,
} from "@angular/core";

import { SocketEventsService } from "../socket-events.service";

@Component({
  selector: "app-video-room",
  templateUrl: "./video-room.component.html",
  styleUrls: ["./video-room.component.scss"],
})
export class VideoRoomComponent implements OnInit, OnDestroy {
  localUser;
  remoteUsers = [];
  resizeTimeout;
  bigElement;

  @Output() hangup = new EventEmitter<boolean>();
  isFullScreen = true;

  socketSub;

  rejected;
  message;
  reconnectTimer;
  @Input() sessionId: string;
  @Input() token: string;
  @Input() patient;
  @Input() audioOnly;
  @Input() videoDeviceId: string;
  @Input() audioDeviceId: string;
  reconnecting = false;
  accepted = false;
  openviduLayout;
  openviduLayoutOptions;
  subscriptions: Subscription[] = [];
  peerId;
  myCamStream: Stream;

  camStatus = "on";

  constructor(
    private socketSer: SocketEventsService,
    private roomService: RoomService,
    private logger: LogService,
    private remotePeersService: RemotePeersService,
    private authService: AuthService
  ) {}

  @HostListener("window:beforeunload")
  beforeunloadHandler() {
    this.exitSession();
  }

  @HostListener("window:resize", ["$event"])
  sizeChange(event) {
    clearTimeout(this.resizeTimeout);
    this.updateLayout();
  }

  ngOnInit() {
    console.log("Initialize video", this.token, this.audioOnly);

    this.peerId = this.authService.currentUserValue.id;

    this.askForPerm().then(() => {
      this.joinToSession();
    });
    // this.accepted = !this.token;

    // this.subscriptions.push(this.socketSer.consultationClosedSubj.subscribe(consultation => {
    //   if (consultation._id === this.sessionId && consultation.consultation && consultation.consultation.status === 'closed') {
    //     console.log('consultation closed >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>..')
    //     this.exitSession();
    //     return true;
    //   }
    // }));

    // this.subscriptions.push(this.socketSer.onRejectCall().subscribe(event => {
    //   console.log('call rejected ', event);
    //   // if (event.data.consultation.id === this.sessionId) {
    //   //   this.exitSession();
    //   // }
    // }));
  }

  ngOnDestroy() {
    this.exitSession();

    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.rejectCall();
    this.remoteUsers = [];
  }

  joinToSession() {
    this.logger.debug("Join to session");
    this.accepted = true;

    this.remoteUsers = [];

    this.roomService.init({ peerId: this.peerId });
    console.log(
      "ROOM SERVICE ",
      this.roomService._closed.toString(),
      this.audioOnly
    );

    this.roomService.join({
      roomId: this.sessionId,
      joinVideo: !this.audioOnly,
      joinAudio: true,
      token: this.token,
    });

    this.roomService.onCamProducing.subscribe((stream) => {
      this.logger.debug("Cam producing ", stream);
      this.myCamStream = { ...stream };
    });
    this.subscriptions.push(
      this.remotePeersService.remotePeers.subscribe((peers) => {
        this.remoteUsers = [];
        this.logger.debug("got remote peers ", peers);
        peers.forEach((p) => {
          this.remoteUsers.push({ ...p });
        });
        setTimeout(() => {
          this.updateLayout();
        }, 100);
      })
    );
    this.openviduLayout = new OpenViduLayout();
    this.openviduLayoutOptions = {
      maxRatio: 3 / 2, // The narrowest ratio that will be used (default 2x3)
      minRatio: 9 / 16, // The widest ratio that will be used (default 16x9)
      fixedRatio:
        true /* If this is true then the aspect ratio of the video is maintained
    and minRatio and maxRatio are ignored (default false)*/,
      bigClass: "OV_big", // The class to add to elements that should be sized bigger
      bigPercentage: 0.9, // The maximum percentage of space the big ones should take up
      bigFixedRatio: true, // fixedRatio for the big ones
      bigMaxRatio: 3 / 2, // The narrowest ratio to use for the big elements (default 2x3)
      bigMinRatio: 9 / 16, // The widest ratio to use for the big elements (default 16x9)
      bigFirst: false, // Whether to place the big one in the top left (true) or bottom right
      animate: true, // Whether you want to animate the transitions
    };
    this.openviduLayout.initLayoutContainer(
      document.getElementById("layout"),
      this.openviduLayoutOptions
    );
  }

  exitSession(rejoin?) {
    this.remoteUsers = [];

    this.openviduLayout = null;

    if (rejoin) {
      return this.joinToSession();
    } else {
      this.rejectCall();
    }
    // this.router.navigate(['']);
  }

  resetVideoSize() {
    const element = document.querySelector(".OV_big");
    if (element) {
      element.classList.remove("OV_big");
      this.bigElement = undefined;
      this.updateLayout();
    }
  }

  private connect(token: string): void {}

  private connectWebCam(): void {}

  private updateLayout() {
    this.resizeTimeout = setTimeout(() => {
      if (!this.openviduLayout) {
        return;
      }
      console.log("update layout .....................................");
      this.openviduLayout.updateLayout();
    }, 20);
  }

  rejectCall() {
    console.log("rejectCall vide -room ");
    if (!this.rejected) {
      this.rejected = true;
      this.roomService.close();
      if (this.myCamStream) {
        this.myCamStream.mediaStream.getTracks().forEach(function (track) {
          track.stop();
        });
      }
      this.remoteUsers = [];
      this.hangup.emit(true);
    }
  }

  toggleButtons() {}

  camStatusChanged() {
    if (this.camStatus === "on") {
      this.roomService.disableWebcam();
      this.camStatus = "off";
    } else {
      this.roomService.updateWebcam({ start: true });
      this.camStatus = "on";
    }
  }

  askForPerm() {
    this.logger.debug("Ask for video permissions ");

    const mediaPerms = { audio: true, video: true };
    return navigator.mediaDevices.getUserMedia(mediaPerms);
  }
}
