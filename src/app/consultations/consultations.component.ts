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

import {jsPDF} from "jspdf";
import {MatLegacyDialog as MatDialog} from "@angular/material/legacy-dialog";
import {UserService} from "../core/user.service";
import {SocketEventsService} from "../core/socket-events.service";
import {ConfigService} from "../core/config.service";
import {ConfirmationDialogComponent} from "../confirmation-dialog/confirmation-dialog.component";
import {MessageService} from "../core/message.service";
import {DatePipe} from "@angular/common";
import {DurationPipe} from "../duration.pipe";


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
        private msgServ: MessageService,
        private datePipe: DatePipe,
        private durationPipe: DurationPipe,
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

        this.status = this.activatedRoute.snapshot.data.status;
        this.title = this.titles.find((t) => t.status === this.status);
        this.getConsultations();
        this.getUnreadCount();

    }

    async openDialog(event, pastConsultation) {
        event.stopPropagation();
        const consultation = pastConsultation.consultation;
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

    resendInvite(event, invitationId) {
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

                this.zone.run(() => {
                    this.consultations = consultations.filter(
                        (c) => c.consultation.status === this.status,
                    );
                    if (this.status === "closed") {
                        this.consultations = this.consultations.sort((a, b) => {
                            return b.consultation.closedAt - a.consultation.closedAt;
                        });
                    }
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

    exportPDF(event, consultation) {
        event.stopPropagation();
        this.generatePDF(consultation.consultation, consultation.nurse);
    }

    generatePDF(data, nurse) {
        this.msgServ
            .getConsultationMessages(
                data._id, undefined, true
            )
            .subscribe((messages) => {

                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
                const imageUrl = this.configService.config?.logo;
                if (imageUrl) {
                    doc.addImage(imageUrl, 'JPEG', (pageWidth / 2) - 25, 10, 50, 20, 'Logo', 'FAST');
                }

                doc.setFont("Helvetica", "normal", 400)
                doc.setFontSize(22);
                doc.text("Consultation report", 15, 40);

                doc.setFontSize(14);
                doc.setTextColor("#464F60");
                doc.text("Patient information", 15, 50);
                if (nurse?.firstName) {
                    doc.text("Requester information", 108, 50);
                }
                if (data.experts?.length) {
                    doc.text("Expert information", 108, 75);
                }

                doc.setFontSize(10);
                doc.setTextColor("#000");
                doc.setFont("Helvetica", "normal", 700);
                doc.text("Firstname:", 15, 55);
                doc.text("Lastname:", 15, 60);
                doc.text("Gender:", 15, 65);

                doc.setFont("Helvetica", "normal", 400);
                doc.text(`${data.firstName}`, 34, 55);
                doc.text(`${data.lastName}`, 34, 60);
                doc.text(`${data.gender}`, 30, 65);

                if (nurse?.firstName) {
                    // Requester Information Column
                    doc.setFont("Helvetica", "normal", 700);
                    doc.text(`Firstname:`, 108, 55);
                    doc.text(`Lastname:`, 108, 60);
                    doc.setFont("Helvetica", "normal", 400);
                    doc.text(`${nurse.firstName}`, 127, 55);
                    doc.text(`${nurse.lastName}`, 127, 60);
                }

                if (data.experts?.length) {
                    let currentExpertPosition = 80;
                    data.experts.forEach((expert) => {
                        doc.setFont("Helvetica", "normal", 700);
                        doc.text(`Firstname:`, 108, currentExpertPosition);
                        doc.text(`Lastname:`, 108, currentExpertPosition + 5);
                        doc.setFont("Helvetica", "normal", 400);
                        doc.text(`${expert.firstName}`, 127, currentExpertPosition );
                        doc.text(`${expert.lastName}`, 127, currentExpertPosition + 5);
                        currentExpertPosition += 10
                    })
                }

                doc.setFontSize(14);
                doc.setTextColor("#464F60");
                doc.text("Consultation information", 15, 75);

                doc.setFontSize(10);
                doc.setTextColor("#000");
                doc.setFont("Helvetica", "normal", 700);
                doc.text(`Start date/time:`, 15, 80);
                doc.text(`End date/time:`, 15, 85);
                doc.text(`Duration:`, 15, 90);
                const currentYPosition = 95;
                if (data.metadata && Object.keys(data.metadata).length) {
                    Object.keys(data.metadata).forEach((key, index) => {
                        doc.text(`${key}:`, 15, currentYPosition + (index * 5));
                    });
                }

                doc.setFont("Helvetica", "normal", 400);
                doc.text(`${this.datePipe.transform(data.acceptedAt, "d MMM yyyy HH:mm")}`, 45, 80);
                doc.text(`${this.datePipe.transform(data.closedAt, "d MMM yyyy HH:mm")}`, 45, 85);
                doc.text(`${this.durationPipe.transform(data.createdAt - data.closedAt)}`, 45, 90);
                // doc.text(`${data.lastName}`, 45, 95);
                if (data.metadata && Object.keys(data.metadata).length) {
                    Object.keys(data.metadata).forEach((key, index) => {
                        doc.text(`${data.metadata[key]}`, 45, currentYPosition + (index * 5));
                    });
                }

                doc.setFontSize(14);
                doc.setTextColor("#464F60");
                doc.text("Chat history", 15, currentYPosition + 30);

                let chatYPosition = currentYPosition + 40;
                messages.forEach(message => {
                    doc.setFontSize(10);
                    doc.setTextColor("#000");
                    doc.setFont("Helvetica", "normal", 700);
                    const firstName = message.fromUserDetail.role === "patient" ? data?.firstName : message.fromUserDetail.firstName || '';
                    const lastName = message.fromUserDetail.role === "patient" ? data?.lastName : message.fromUserDetail.lastName || '';
                    const {role} = message.fromUserDetail;
                    const date = this.datePipe.transform(message.createdAt, "dd LLL HH:mm");
                    doc.text(`${firstName} ${lastName} (${role}) - ${date}:`, 15, chatYPosition);

                    doc.setFont("Helvetica", "normal", 400);
                    doc.setTextColor("#464F60");
                    chatYPosition += 5;
                    doc.text(message.text, 15, chatYPosition);

                    chatYPosition += 5;
                });

                doc.save("consultation-report.pdf");
            })
    }


    async generateAndSavePDF() {
        const filename = `${this.PDFConsultation._id}.pdf`;
        const pagesCount =
            Math.floor(this.chatHistory.nativeElement.offsetHeight / 2970) + 1;
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
                this.consultationService
                    .sendReport(
                        new File([pdf.output("arraybuffer")], "report.pdf", {
                            type: "application/pdf",
                        }),
                        this.PDFConsultation._id,
                    )
                    .subscribe((r) => {
                    });
                this.PDFConsultation = null;
                return;
            }
            pdf.addPage();
        }
    }
}
