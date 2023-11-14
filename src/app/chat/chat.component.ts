import { Subscription } from "rxjs"
import {
  Component,
  OnInit,
  Input,
  NgZone,
  ViewChild,
  ElementRef,
  EventEmitter,
  Output,
  OnDestroy,
  HostListener,
} from "@angular/core"
import {TranslateService} from "@ngx-translate/core";
import { MessageService } from "../core/message.service"
import { AuthService } from "../auth/auth.service"
import { SocketEventsService } from "../core/socket-events.service"
import { ConsultationService } from "../core/consultation.service"
import { environment } from "../../environments/environment"
import {MatDialog} from "@angular/material/dialog";
import {InviteExpertComponent} from "../invite-expoert/invite-expert.component";
import {ConfirmationDialogComponent} from "../confirmation-dialog/confirmation-dialog.component";
import {InviteService} from "../core/invite.service";


@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"],
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() consultation
  @Input() publicinvite
  @Input() showInput: boolean
  @ViewChild("scoll") contentArea: ElementRef
  @ViewChild("fileInput") fileInput: ElementRef
  @ViewChild('element') element: ElementRef;

  currentUser
  chatMessages = []
  chatText: string

  loadingMsgs = true
  @Input() noPagination = false
  @Output() loaded = new EventEmitter<boolean>()

  chatHeight: string;
  loadedImages = 0
  chatImagesCount
  subscriptions: Subscription[] = []
  consultations = [];

  constructor(
    private msgServ: MessageService,
    private authService: AuthService,
    private socketEventsService: SocketEventsService,
    private zone: NgZone,
    private consultationService: ConsultationService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private inviteService: InviteService,
  ) { }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.calculateHeight();
  }

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue

    this.getMessages()
    this.socketEventsService.onMessage().subscribe((msg) => {
      if (
        msg.data.consultation !==
        (this.consultation._id || this.consultation.id)
      ) {
        return
      }

      this.zone.run(() => {
        this.chatMessages.push(this.adjustMsg(msg.data))

        this.scrollToBottom()
      })
    })

    this.listenToCallEvents()
  }

  inviteExpert(expertLink: string) {
    const dialogRef = this.dialog.open(InviteExpertComponent, {
      width: "800px",
      data: expertLink,
      autoFocus: false
    });
  }

  resendInvite(invitationId) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      id: "confirmation_dialog",
      data: {
        question: this.translate.instant("invitations.confirmResend"),
        yesText: this.translate.instant("invitations.sendAgain"),
        noText: this.translate.instant("invitations.cancelSendAgain"),
        title: this.translate.instant("invitations.resendConfirmTitle"),
      },
    });
    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.inviteService.resendInvite(invitationId).subscribe((res) => {
        });
      }
    });

  }

  getExpertStatusById(id, flagExpertsOnline) {
    if(flagExpertsOnline && id in flagExpertsOnline) {
      return flagExpertsOnline[id];
    }
    return false;
  }

  listenToCallEvents() {
    this.subscriptions.push(
      this.socketEventsService.onRejectCall().subscribe((event) => {
        console.log("call rejected .................", event)

        const message = this.chatMessages.find(
          (msg) => msg.id === event.data.message.id,
        )
        if (message) {
          message.closedAt = new Date()
        }
      }),
    )
    this.subscriptions.push(
      this.socketEventsService.onAcceptCall().subscribe((event) => {
        console.log("call accepted.................", event)
        const message = this.chatMessages.find(
          (msg) => msg.id === event.data.message.id,
        )
        if (message) {
          message.acceptedAt = new Date()
        }
      }),
    )
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe()
    })
  }

  async getMessages(noScroll?) {
    this.loadingMsgs = true

    this.msgServ
      .getConsultationMessages(
        this.consultation._id || this.consultation.id,
        this.chatMessages.length,
        this.noPagination,
      )
      .subscribe((msgs) => {
        this.zone.run(() => {
          this.chatMessages = msgs
            .map((m) => {
              return this.adjustMsg(m)
            })
            .concat(this.chatMessages)

          this.chatImagesCount = this.chatMessages.filter(
            (msg) => msg.isImage,
          ).length
          this.loadingMsgs = false

          if (this.noPagination && !this.chatImagesCount) {
            setTimeout(() => {
              this.addPageDividers();
            }, 0)
          }

          if (!noScroll) {
            this.scrollToBottom(100);
          }
          this.calculateHeight();
        });
      })
  }
  scrollToBottom(after?): void {
    try {
      setTimeout(() => {
        console.log("scroll to bottom")
        this.contentArea.nativeElement.scrollTop = this.contentArea?.nativeElement?.scrollHeight
      }, after || 10)
    } catch (err) { }
  }

  send() {
    this.chatText = this.chatText.trim()
    if (this.chatText === "") {
      return
    }

    this.chatMessages.push({
      direction: "outgoing",
      text: this.chatText,
      createdAt: Date.now(),
      from: {
        firstName: this.currentUser?.firstName,
        lastName: this.currentUser?.lastName
      }
    })

    this.scrollToBottom()
    this.msgServ
      .sendMessage(this.consultation.id || this.consultation._id, this.chatText)
      .subscribe((r) => { })

    this.chatText = ""
  }

  sendMsg(event) {
    if (event.charCode === 13) {
      this.send()
      return false
    }
  }
  readMessages() {
    this.consultationService.readMessages(
      this.consultation.id || this.consultation._id,
    )
  }

  adjustMsg(msg) {
    if (msg.type === "attachment") {
      msg.attachmentsURL =
        environment.api +
        `/consultation/${
        this.consultation._id || this.consultation.id
        }/attachment/${msg.id}?token=${this.currentUser.token}`

      if (msg.mimeType.endsWith("jpeg") || msg.mimeType.endsWith("png")) {
        msg.isImage = true
      } else if (msg.mimeType.startsWith("audio")) {
        msg.isAudio = true
      } else {
        msg.isFile = true
      }
    }

    if (msg.from.id === this.currentUser.id) {
      msg.direction = "outgoing"
    } else {
      msg.direction = "incoming"
    }
    return msg
  }


  extractFilename(url: string): string | null {
    const urlPaths = url.split('/');
    const lastPath = urlPaths[urlPaths.length - 1];
    return lastPath.split('#')[0].split('?')[0];
  }

  downloadPdf(pdfUrl: string): void {
    this.consultationService.downloadPdf(pdfUrl).subscribe(blob => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      const filename = this.extractFilename(pdfUrl);
      link.download = filename || 'attachment.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    });
  }

  showAttachBrowseDlg() {
    const event = new MouseEvent("click", { bubbles: true })
    this.fileInput.nativeElement.dispatchEvent(event)
  }

  handleFileInput(event) {
    if (!event.target.files.item(0)) {
      return
    }
    this.consultationService
      .postFile(
        event.target.files.item(0),
        this.consultation.id || this.consultation._id,
      )
      .subscribe((data) => {
        this.zone.run(() => {
          this.chatMessages.push(this.adjustMsg(data.message))
          this.scrollToBottom(100)
        })
      })
  }
  @HostListener("scroll", ["$event"])
  public handleScroll(event) {
    const isReachingTop = event.target.scrollTop < 600
    if (isReachingTop && !this.loadingMsgs && !this.noPagination) {
      this.getMessages(true)
    }
  }

  addPageDividers() {
    let page = 1
    this.chatMessages.forEach((msg) => {
      const elem = document.getElementById(msg.id)
      console.log("add divider ", elem, elem.offsetTop)

      if (!elem) {
        return
      }
      if (elem.offsetTop > 2970 * page - 720 && elem.offsetTop < 2970 * page) {
        elem.style["margin-top"] = "700px"
        page++
      }
    })
    this.loaded.emit(true)
  }

  sleep(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        return resolve(null)
      }, ms)
    })
  }

  imageLoaded() {
    this.loadedImages++
    if (this.loadedImages === this.chatImagesCount && this.noPagination) {
      this.addPageDividers()
    }
  }

  calculateHeight(): void {
    this.chatHeight = `calc(100% - ${this.element?.nativeElement?.offsetHeight}px)`;
  }
}
