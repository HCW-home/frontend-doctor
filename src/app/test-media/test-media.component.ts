import { RoomService, LogService, Stream } from "hug-angular-lib";
import { AuthService } from "./../auth/auth.service";
import { OpenViduService } from "./../openvidu.service";
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from "@angular/core";

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
  volumeLevel: number = 0;
  showSpinner;
  error;
  peerId: string;
  @ViewChild("videoElement") videoElement: ElementRef;

  constructor(
    private openviduSev: OpenViduService,
    private authService: AuthService,
    private logger: LogService,
    private roomService: RoomService
  ) {}

  ngOnInit() {
    this.peerId = this.authService.currentUserValue.id;
    this.showSpinner = true;
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
        this.openviduSev.getDevices().then((devices) => {
          console.log("devices ", devices);
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
    this.roomService.close();
  }

  initMediaTests() {
    this.roomService.onVolumeChange.subscribe((change) => {
      console.log("Volume change ", change);

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
      this.error = err.error?.message || err.statusText || err.message || err;
      this.showSpinner  = false;
    })
  }
}
