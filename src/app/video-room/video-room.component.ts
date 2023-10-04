import {AuthService} from "../auth/auth.service";
import {
    RoomService,
    LogService,
    RemotePeersService,
    Stream,
} from "hcw-stream-lib";
import {
    OpenViduLayout,
} from "./layout/openvidu-layout";
import {Subscription} from "rxjs";
import {
    Component,
    OnInit,
    OnDestroy,
    HostListener,
    EventEmitter,
    Output,
    Input,
} from "@angular/core";

import {SocketEventsService} from "../core/socket-events.service";

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
    muteStatus: "on" | "off" = "on";
    localStream: MediaStream | null = null;

    @Output() hangup = new EventEmitter<boolean>();

    rejected;
    message;
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
    ) {
    }

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
        if (this.audioOnly) {
            this.camStatus = "off";
        }
        this.peerId = this.authService.currentUserValue.id;

        this.askForPerm().then((stream) => {
            this.localStream = stream;
            this.joinToSession();
        }).catch(error => {
            console.error("Error accessing media devices.", error);
        });
    }

    ngOnDestroy() {
        this.exitSession();

        this.subscriptions.forEach((sub) => {
            sub.unsubscribe();
        });
        this.rejectCall();
        this.remoteUsers = [];
        this.roomService.close();
    }

    muteStatusChanged() {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                if (this.muteStatus === "on") {
                    this.roomService.muteMic();
                    this.muteStatus = "off";
                } else {
                    this.roomService.unmuteMic();
                    this.muteStatus = "on";
                }
            }
        }
    }

    joinToSession() {
        this.accepted = true;

        this.remoteUsers = [];

        this.roomService.init({peerId: this.peerId});

        this.roomService.join({
            roomId: this.sessionId,
            joinVideo: !this.audioOnly,
            joinAudio: true,
            token: this.token,
        });

        this.roomService.onCamProducing.subscribe((stream) => {
            this.logger.debug("Cam producing ", stream);
            this.myCamStream = {...stream};
        });
        this.subscriptions.push(
            this.remotePeersService.remotePeers.subscribe((peers) => {
                this.remoteUsers = [];
                this.logger.debug("got remote peers ", peers);
                peers.forEach((p) => {
                    this.remoteUsers.push({...p});
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

    private connect(token: string): void {
    }

    private connectWebCam(): void {
    }

    private updateLayout() {
        this.resizeTimeout = setTimeout(() => {
            if (!this.openviduLayout) {
                return;
            }
            this.openviduLayout.updateLayout();
        }, 20);
    }

    rejectCall() {
        if (!this.rejected) {
            this.rejected = true;
            this.roomService.close();
            if (this.myCamStream) {
                this.myCamStream.mediaStream.getTracks().forEach((track) => {
                    track.stop();
                });
            }
            this.remoteUsers = [];
            this.hangup.emit(true);
        }
    }

    toggleButtons() {
    }

    camStatusChanged() {
        if (this.camStatus === "on") {
            this.roomService.disableWebcam();
            this.camStatus = "off";
        } else {
            this.roomService.updateWebcam({start: true, restart: true});
            this.camStatus = "on";
        }
    }

    askForPerm() {
        this.logger.debug("Ask for video permissions ");

        const mediaPerms = {audio: true, video: true};
        return navigator.mediaDevices.getUserMedia(mediaPerms);
    }
}
