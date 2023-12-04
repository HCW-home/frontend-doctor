import { RoomService, LogService } from "hcw-stream-lib";
import { AuthService } from "./../auth/auth.service";
import { OpenViduService } from "./../openvidu.service";
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from "@angular/core";
import {Subscription} from "rxjs";
import {ErrorDialogComponent} from "../error-dialog/error-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: "app-test-media",
  templateUrl: "./test-media.component.html",
  styleUrls: ["./test-media.component.scss"],
})
export class TestMediaComponent implements OnInit, OnDestroy {
  title: {
    title: "Test son & vidéo";
    icon: "chat";
  };

  videoDeviceId: string;
  audioDeviceId: string;
  videoDevices = [];
  audioDevices = [];
  myCamStream;
  volumeLevel = 0;
  showSpinner;
  error;
  peerId: string;
  private volumeChangeSubscription: Subscription;
  @ViewChild("videoElement") videoElement: ElementRef;

  constructor(
    private openviduSev: OpenViduService,
    private authService: AuthService,
    private logger: LogService,
    private roomService: RoomService,
    public dialog: MatDialog,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.peerId = this.authService.currentUserValue.id;
    this.showSpinner = true;
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
        this.openviduSev.getDevices().then((devices) => {
          this.videoDevices = devices.filter(
            (device) => device.kind === "videoinput"
          );
          if (
            this.videoDevices.length &&
            this.videoDevices[0].deviceId !== ""
          ) {
            this.videoDeviceId = this.videoDevices[0].deviceId;
          }
          this.audioDevices = devices.filter(
            (device) => device.kind === "audioinput"
          );
          if (
            this.audioDevices.length &&
            this.audioDevices[0].deviceId !== ""
          ) {
            this.audioDeviceId = this.audioDevices[0].deviceId;
          }
          this.initMediaTests();
        });
      })
      .catch((error) => {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            stream.getTracks().forEach((track) => track.stop());
            this.openviduSev.getDevices().then((devices) => {
              this.videoDevices = devices.filter(
                (device) => device.kind === "videoinput"
              );
              if (
                this.videoDevices.length &&
                this.videoDevices[0].deviceId !== ""
              ) {
                this.videoDeviceId = this.videoDevices[0].deviceId;
              }
              this.initMediaTests();
            });
          })
          .catch((error) => {
            this.showSpinner = false;
          });
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            stream.getTracks().forEach((track) => track.stop());
            this.openviduSev.getDevices().then((devices) => {
              this.audioDevices = devices.filter(
                (device) => device.kind === "audioinput"
              );
              if (
                this.audioDevices.length &&
                this.audioDevices[0].deviceId !== ""
              ) {
                this.audioDeviceId = this.audioDevices[0].deviceId;
              }
              this.initMediaTests();
            });
          })
          .catch((err) => {
            this.showSpinner = false;
          });
      });
  }

  ngOnDestroy() {
    this.volumeChangeSubscription?.unsubscribe();
    this.roomService.close();
  }

  initMediaTests() {
    this.volumeChangeSubscription = this.roomService.onVolumeChange.subscribe((change) => {
      this.volumeLevel = change.volume * 1000;
    });

    this.openviduSev.getTestToken().then(({ token }) => {
      this.roomService.init({ peerId: this.peerId });

      this.roomService.join({
        roomId: this.peerId,
        joinVideo: true,
        joinAudio: true,
        token,
      });

      this.roomService.onCamProducing.subscribe((stream) => {
        this.logger.debug("Cam producing ", stream);
        this.myCamStream = stream;

        this.showSpinner = false;
      });
    }, (err) => {
      const message = err.error?.details || err.details || err.error?.message || err.statusText || err.message || err;
      const errorMessage = `${this.translate.instant("testMedia.testError")} ${message}`
      this.showErrorDialog(errorMessage, '');
      this.showSpinner  = false;
    })
  }

  showErrorDialog(message: string, title: string): void {
    this.dialog.open(ErrorDialogComponent, {
      width: '450px',
      autoFocus: false,
      data: {
        title,
        message
      },
    });
  }
}
