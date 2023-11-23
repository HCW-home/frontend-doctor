import {Subscription} from "rxjs";
import {
    Component,
    OnInit,
    NgZone,
    OnDestroy,
    ViewChild,
    ElementRef,
} from "@angular/core";

import {TranslateService} from "@ngx-translate/core";

import {ConsultationService} from "../core/consultation.service";
import {Router, ActivatedRoute} from "@angular/router";
import {AuthService} from "../auth/auth.service";
import {InviteService} from "../core/invite.service";
import html2canvas from "html2canvas";
import {InviteFormComponent} from "./../invite-form/invite-form.component";

import { jsPDF } from "jspdf";
import {MatDialog} from "@angular/material/dialog";
import {UserService} from "../core/user.service";
import {SocketEventsService} from "../core/socket-events.service";
import {ConfigService} from "../core/config.service";
import {ConfirmationDialogComponent} from "../confirmation-dialog/confirmation-dialog.component";


@Component({
    selector: "app-consultations",
    templateUrl: "./consultations.component.html",
    styleUrls: ["./consultations.component.scss"],
})
export class ConsultationsComponent implements OnInit, OnDestroy {
    @ViewChild("chatHistory") chatHistory: ElementRef;

    unreadPendingCount = 0;
    consultations = [];
    unreadActiveCount = 0;
    page = 0;
    status;
    overviewSub;
    unreadActiveCountSub;
    unreadPendingCountSub;
    unreadCount;
    currentConsultation;
    chatOpen;
    unreadClosedCountSub;
    title: {
        title
        icon
    };
    exportedCon;
    titles = [
        {
            status: "pending",
            title: "Salle d'attente",
            icon: "queue",
        },
        {
            status: "active",
            title: "Consultations ouvertes",
            icon: "chat",
        },
        {
            status: "closed",
            title: "Historique des consultations",
            icon: "history",
        },
    ];

    currentUser;
    consultationId;
    onlineStaus;
    PDFConsultation;
    subscriptions: Subscription[] = [];

    constructor(
        private consultationService: ConsultationService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private zone: NgZone,
        private authService: AuthService,
        public dialog: MatDialog,
        private userService: UserService,
        private inviteService: InviteService,
        private _socketEventsService: SocketEventsService,
        private activeRoute: ActivatedRoute,
        private translate: TranslateService,
        public configService: ConfigService,
    ) {
        this.titles = [
            {
                status: "pending",
                title: translate.instant("consultations.waitingRoom"),
                icon: "queue",
            },
            {
                status: "active",
                title: translate.instant("consultations.openedConsultation"),
                icon: "chat",
            },
            {
                status: "closed",
                title: translate.instant("consultations.consultationsHistory"),
                icon: "history",
            },
        ];
    }

    ngOnInit() {
        this.consultationId = this.activeRoute.snapshot.params.id;
        this.currentUser = this.authService.currentUserValue;
        console.log("current user ", this.currentUser);

        this.status = this.activatedRoute.snapshot.data.status;
        this.title = this.titles.find((t) => t.status === this.status);
        this.getConsultations();
        this.getUnreadCount();

    }

    async openDialog(event,pastConsultation) {
        event.stopPropagation();
        const consultation = pastConsultation.consultation;
        console.log(pastConsultation);
        const user = await this.userService.getUser(consultation.owner).toPromise();
        const data = {
            gender: consultation.gender,
            queue: consultation.queue,
            firstName: consultation.firstName,
            lastName: consultation.lastName,
            emailAddress: user.email,
            phoneNumber: user.phoneNumber,
            metadata: consultation.metadata, // ! metadata
        };
        const dialogRef = this.dialog.open(InviteFormComponent, {
            id: "invite_form_dialog",
            // ineffective?
            width: "500px",
            height: "70%",
            data,
        });
    }

    resendInvite(event,invitationId) {
        event.stopPropagation();
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

    trackItem(index, consultations) {
        return `${index}-${consultations.id}`;
    }

    getConsultations() {

        this.overviewSub = this.consultationService
            .getConsultationsOverview()
            .subscribe((consultations) => {
                console.log("got consultation over ", consultations);

                this.zone.run(() => {
                    this.consultations = consultations.filter(
                        (c) => c.consultation.status === this.status,
                    );
                    if (this.status === "closed") {
                        this.consultations = this.consultations.sort((a, b) => {
                            return b.consultation.closedAt - a.consultation.closedAt;
                        });
                    }
                    console.log(this.consultations);
                });
            });
    }

    getUnreadCount() {
        if (this.status === "active") {
            this.unreadActiveCountSub = this.consultationService
                .unreadActiveCount()
                .subscribe((count) => {
                    this.zone.run(() => {
                        this.unreadCount = count;
                    });
                });
        }

        if (this.status === "pending") {
            this.unreadPendingCountSub = this.consultationService
                .unreadPendingCount()
                .subscribe((count) => {
                    this.zone.run(() => {
                        this.unreadCount = count;
                    });
                });
        }
    }

    showChat(id) {
        // if (this.status === 'closed') {
        //   return;
        // }
        this.currentConsultation = this.consultations.find((c) => c._id === id);

        this.chatOpen = true;
    }

    ngOnDestroy() {
        if (this.overviewSub) {
            this.overviewSub.unsubscribe();
        }

        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
        if (this.status === "active") {
            if (this.unreadActiveCountSub) {
                this.unreadActiveCountSub.unsubscribe();
            }
        }
        if (this.status === "pending") {
            if (this.unreadPendingCountSub) {
                this.unreadPendingCountSub.unsubscribe();
            }
        }
    }

    exportPDF(event,consultation) {
        event.stopPropagation();
        this.PDFConsultation = consultation;
    }

    async generateAndSavePDF() {
        const filename = `${this.PDFConsultation._id}.pdf`;
        const pagesCount =
            Math.floor(this.chatHistory.nativeElement.offsetHeight / 2970) + 1;
        console.log("pages count ", pagesCount);
        const pdf = new jsPDF("p", "mm", "a4", true);
        for (let page = 0; page < pagesCount; page++) {
            const canvas = await html2canvas(document.querySelector("#chatHistory"), {
                // letterRendering: 1,
                y:
                    page * 2970 -
                    document.querySelector(".mat-drawer-content.mat-sidenav-content")
                        .scrollTop,
                height: 2970,
                useCORS: true,
            });
            pdf.addImage(
                canvas.toDataURL("image/png"),
                "PNG",
                0,
                0,
                211,
                297,
                "",
                "MEDIUM",
            );

            if (page === pagesCount - 1) {
                pdf.save(filename);
                console.log(typeof pdf.output("arraybuffer"));
                this.consultationService
                    .sendReport(
                        new File([pdf.output("arraybuffer")], "report.pdf", {
                            type: "application/pdf",
                        }),
                        this.PDFConsultation._id,
                    )
                    .subscribe((r) => {
                        console.log("file saved ");
                    });
                this.PDFConsultation = null;
                // console.log('pdf output ')
                return;
            }
            pdf.addPage();
        }
    }
}
