import { Subscription } from "rxjs";
import { Stream, LogService } from "hcw-stream-lib";
import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  OnChanges,
} from "@angular/core";

@Component({
  selector: "app-peer-video-screen",
  templateUrl: "./peer-video-screen.component.html",
  styleUrls: ["./peer-video-screen.component.scss"],
})
export class PeerVideoScreenComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild("videoElement") elementRef: ElementRef;

  @Input() stream: Stream;

  subscriptions: Subscription[] = [];
  constructor(private logger: LogService) {}

  ngAfterViewInit() {
    this.updateVideoSrc();
  }

  // ngOnInit(): void {
  // Called after the constructor, initializing input properties, and the first call to ngOnChanges.
  // Add 'implements OnInit' to the class.
  // this.subscriptions.push(this.stream.onLayerChange.subscribe(() => {
  //   this.logger.debug('ov-vide onlayerchanged.........')
  //   this.elementRef.nativeElement.srcObject = this.stream.mediaStream
  // }))
  // }

  ngOnDestroy(): void {
    // Called once, before the instance is destroyed.
    // Add 'implements OnDestroy' to the class.
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  ngOnChanges(changes) {
    if (changes.stream) {
      this.stream = changes.stream.currentValue;
      this.updateVideoSrc();
    }
  }

  updateVideoSrc() {
    if (this.elementRef && this.stream) {
      this.elementRef.nativeElement.srcObject = this.stream;
    }
    setTimeout(() => {
      if (this.elementRef) {
        this.elementRef.nativeElement.srcObject = this.stream;
      }
    }, 500);
  }
}
